<?php
// File: backend/classes/SecurityManager.php
require_once __DIR__ . '/../error_handler.php'; // Memastikan error_handler dimuat
require_once __DIR__ . '/../config/database.php'; // Untuk koneksi database
require_once __DIR__ . '/ApiResponse.php'; // Untuk respon error

class SecurityManager {
    // Gunakan database untuk melacak upaya brute force dan OTP spam secara persisten
    private static $dbInstance = null;

    private static function getDbConnection() {
        if (self::$dbInstance === null) {
            $database = new Database();
            self::$dbInstance = $database->getConnection();
        }
        return self::$dbInstance;
    }

    /**
     * Mencegah serangan brute force pada login atau operasi lain.
     * Logika ini menggunakan database untuk penyimpanan persisten.
     *
     * @param string $identifier Pengidentifikasi unik (misal: IP address atau email).
     * @param string $type Jenis log (e.g., 'login_attempt', 'otp_verify_attempt').
     * @param int $maxAttempts Jumlah maksimum upaya yang diizinkan dalam periode lockout.
     * @param int $lockoutTime Durasi lockout dalam detik.
     * @throws Exception Jika jumlah upaya melebihi batas.
     */
    public static function preventBruteForce($identifier, $type, $maxAttempts = 5, $lockoutTime = 300) {
        $db = self::getDbConnection();
        $currentTime = time();

        // 1. Bersihkan log lama yang sudah kedaluwarsa
        $stmtCleanup = $db->prepare("DELETE FROM security_logs WHERE type = ? AND identifier = ? AND timestamp < FROM_UNIXTIME(?)");
        $stmtCleanup->execute([$type, $identifier, $currentTime - $lockoutTime]);

        // 2. Cek apakah saat ini sedang dalam periode lockout
        $stmtLockout = $db->prepare("SELECT expires_at FROM security_logs WHERE type = ? AND identifier = ? AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1");
        $stmtLockout->execute([$type . '_lockout', $identifier]);
        $lockoutRecord = $stmtLockout->fetch(PDO::FETCH_ASSOC);

        if ($lockoutRecord) {
            $remainingTime = strtotime($lockoutRecord['expires_at']) - $currentTime;
            if ($remainingTime > 0) {
                ErrorLogger::logSecurityEvent('brute_force_lockout_active', "Identifier {$identifier} is still locked out for type {$type}. Remaining time: {$remainingTime}s");
                ApiResponse::error("Terlalu banyak percobaan. Coba lagi dalam " . ceil($remainingTime / 60) . " menit.", 429);
            }
        }

        // 3. Catat upaya saat ini
        $stmtInsertAttempt = $db->prepare("INSERT INTO security_logs (type, identifier, timestamp) VALUES (?, ?, NOW())");
        $stmtInsertAttempt->execute([$type, $identifier]);

        // 4. Hitung upaya dalam periode lockout
        $stmtCountAttempts = $db->prepare("SELECT COUNT(*) FROM security_logs WHERE type = ? AND identifier = ? AND timestamp > FROM_UNIXTIME(?)");
        $stmtCountAttempts->execute([$type, $identifier, $currentTime - $lockoutTime]);
        $attemptCount = $stmtCountAttempts->fetchColumn();

        if ($attemptCount >= $maxAttempts) {
            // Jika melebihi batas, terapkan lockout
            $lockoutExpires = date('Y-m-d H:i:s', $currentTime + $lockoutTime);
            $stmtInsertLockout = $db->prepare("INSERT INTO security_logs (type, identifier, timestamp, expires_at) VALUES (?, ?, NOW(), ?)");
            $stmtInsertLockout->execute([$type . '_lockout', $identifier, $lockoutExpires]);
            
            ErrorLogger::logSecurityEvent('brute_force_threshold_reached', "Identifier {$identifier} locked out for type {$type} for {$lockoutTime}s.");
            ApiResponse::error("Terlalu banyak percobaan. Akun Anda telah terkunci untuk sementara. Coba lagi dalam " . ceil($lockoutTime / 60) . " menit.", 429);
        }
    }
    
    /**
     * Mencegah spam permintaan OTP.
     * Logika ini menggunakan database untuk penyimpanan persisten.
     *
     * @param string $identifier Pengidentifikasi unik (misal: email atau IP address).
     * @param int $maxAttempts Jumlah maksimum permintaan OTP dalam periode lockout.
     * @param int $lockoutTime Durasi lockout dalam detik.
     * @throws Exception Jika jumlah permintaan melebihi batas.
     * @return bool True jika permintaan diizinkan untuk dilanjutkan.
     */
    public static function preventOtpSpam($identifier, $maxAttempts = 3, $lockoutTime = 900) {
        self::preventBruteForce($identifier, 'otp_attempt', $maxAttempts, $lockoutTime);
        return true; // Jika tidak ada exception, berarti diizinkan
    }
    
    /**
     * Mendapatkan waktu cooldown OTP yang tersisa untuk pengidentifikasi tertentu.
     * @param string $identifier Pengidentifikasi unik (misal: email).
     * @param int $defaultCooldown Waktu cooldown default untuk permintaan pertama yang tidak ter-lockout.
     * @return int Waktu cooldown tersisa dalam detik.
     */
    public static function getOtpCooldown($identifier) {
        $db = self::getDbConnection();
        $currentTime = time();
        
        // Cek apakah sedang dalam periode lockout dari preventOtpSpam
        $stmtLockout = $db->prepare("SELECT expires_at FROM security_logs WHERE type = 'otp_attempt_lockout' AND identifier = ? AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1");
        $stmtLockout->execute([$identifier]);
        $lockoutRecord = $stmtLockout->fetch(PDO::FETCH_ASSOC);

        if ($lockoutRecord) {
            return strtotime($lockoutRecord['expires_at']) - $currentTime;
        }

        // Jika tidak di-lockout, cek waktu sejak upaya terakhir
        $stmtLastAttempt = $db->prepare("SELECT timestamp FROM security_logs WHERE type = 'otp_attempt' AND identifier = ? ORDER BY timestamp DESC LIMIT 1");
        $stmtLastAttempt->execute([$identifier]);
        $lastAttemptRecord = $stmtLastAttempt->fetch(PDO::FETCH_ASSOC);

        if ($lastAttemptRecord) {
            $lastAttemptTime = strtotime($lastAttemptRecord['timestamp']);
            $timeSinceLastAttempt = $currentTime - $lastAttemptTime;
            
            // Hitung berapa kali OTP telah diminta dalam periode terakhir (misal 15 menit)
            $stmtCountAttempts = $db->prepare("SELECT COUNT(*) FROM security_logs WHERE type = 'otp_attempt' AND identifier = ? AND timestamp > FROM_UNIXTIME(?)");
            $stmtCountAttempts->execute([$identifier, $currentTime - 900]); // Dalam 15 menit terakhir
            $attemptCount = $stmtCountAttempts->fetchColumn();

            // Aturan cooldown bertingkat
            if ($attemptCount <= 1) { // Upaya pertama setelah bersih/lama
                $cooldown = 30; // 30 detik
            } elseif ($attemptCount <= 3) { // Upaya ke-2 atau ke-3
                $cooldown = 300; // 5 menit
            } else { // Upaya setelah itu
                $cooldown = 900; // 15 menit
            }
            
            return max(0, $cooldown - $timeSinceLastAttempt);
        }
        
        return 0; // Tidak ada upaya sebelumnya, tidak ada cooldown
    }
    
    /**
     * Membersihkan input dari potensi XSS dan spasi ekstra.
     * Menggunakan htmlspecialchars untuk XSS.
     *
     * @param mixed $input String atau array of strings.
     * @return mixed Input yang sudah disanitasi.
     */
    public static function sanitizeInput($input) {
        if (is_array($input)) {
            return array_map([self::class, 'sanitizeInput'], $input);
        }
        
        if (is_string($input)) {
            // Hapus HTML tags yang tidak diizinkan untuk mencegah XSS
            // Jika Anda mengizinkan HTML tertentu, gunakan strip_tags dengan daftar tag yang diizinkan
            $input = strip_tags($input); // Hapus semua tag HTML secara default
            // Konversi karakter khusus menjadi entitas HTML
            $input = htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            // Hapus karakter kontrol dan spasi berlebihan
            $input = trim(preg_replace('/\s+/', ' ', $input));
            
            return $input;
        }
        
        return $input;
    }
    
    public static function generateSecureToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 3
        ]);
    }
    
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    public static function validateFileUpload($file, $allowedTypes = ['pdf', 'jpg', 'jpeg', 'png'], $maxSize = 5242880) {
        // validateFileUpload should return a boolean or throw specific exceptions
        if (!isset($file['error']) || is_array($file['error'])) {
            throw new RuntimeException('Parameter file tidak valid atau terjadi error upload PHP.');
        }
        
        switch ($file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                throw new RuntimeException('File tidak ditemukan.');
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                throw new RuntimeException('File terlalu besar dari batas server atau form (maksimal 5MB).');
            default:
                throw new RuntimeException('Terjadi kesalahan tidak dikenal saat upload file. Kode error: ' . $file['error']);
        }
        
        if ($file['size'] > $maxSize) {
            throw new RuntimeException('Ukuran file melebihi batas yang diizinkan (maksimal ' . ($maxSize / 1024 / 1024) . 'MB).');
        }
        
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        $allowedMimes = [
            'pdf' => 'application/pdf',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png'
        ];
        
        if (!in_array($extension, $allowedTypes) || !in_array($mimeType, array_values($allowedMimes))) {
            throw new RuntimeException('Tipe file tidak diizinkan. Hanya PDF, JPG, JPEG, PNG yang diperbolehkan. Tipe file terdeteksi: ' . $mimeType);
        }
        
        return true;
    }
}