<?php
// File: backend/classes/JWT.php
require_once __DIR__ . '/../error_handler.php'; // Pastikan error_handler dimuat
require_once __DIR__ . '/../config/database.php'; // Membutuhkan kelas Database
require_once __DIR__ . '/../config/app.php'; // Untuk memuat env APP_BASE_URL (dan .env)
require_once __DIR__ . '/ErrorLogger.php'; // Pastikan ErrorLogger dimuat

class JWT {
    private static $secret; 
    private $db; // Untuk denylist berbasis database

    public function __construct() {
        // --- PERBAIKAN KRITIS: Pastikan secret key dimuat dari environment variable ---
        // APP_BASE_URL di app.php akan memuat .env jika ada
        self::$secret = $_ENV['JWT_SECRET_KEY'] ?? null;
        if (empty(self::$secret)) {
            // Ini adalah fallback terakhir, HARUS diganti di produksi
            // Jika ini muncul di log, berarti .env tidak dimuat atau JWT_SECRET_KEY tidak disetel.
            self::$secret = 'your-super-secure-default-key-DO-NOT-USE-IN-PRODUCTION'; 
            ErrorLogger::logSystemError('jwt_secret_missing', 'JWT_SECRET_KEY is not set in environment variables. Using a default insecure value. THIS IS A SECURITY RISK!');
        }
        // --- AKHIR PERBAIKAN KRITIS ---

        $database = new Database(); // Asumsi kelas Database ada dan mengembalikan PDO
        $this->db = $database->getConnection();
    }

    /**
     * Memeriksa apakah token ada dalam denylist.
     * @param string $jwtId JWT ID (jti) dari payload token.
     * @return bool True jika token ditolak, false jika tidak.
     */
    private function isTokenDenied($jwtId) {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM jwt_blacklist WHERE jwt_id = ? AND expires_at > NOW()");
            $stmt->execute([$jwtId]);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            ErrorLogger::logDatabaseError('jwt_denylist_check', 'SELECT from jwt_blacklist', $e->getMessage(), ['jwt_id' => $jwtId]);
            // Jika terjadi error database saat memeriksa denylist, untuk keamanan, anggap token ditolak.
            return true; 
        }
    }

    public static function encode($payload, $exp = 3600) {
        // Instansiasi kelas untuk memuat secret key dan koneksi DB
        new self(); 

        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        $payload['iat'] = time();
        $payload['exp'] = time() + $exp;
        $payload['jti'] = bin2hex(random_bytes(16)); // Tambahkan JWT ID (JTI) untuk denylist

        $encodedHeader = self::base64UrlEncode($header);
        $encodedPayload = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac('sha256', $encodedHeader . "." . $encodedPayload, self::$secret, true);
        $encodedSignature = self::base64UrlEncode($signature);
        
        $jwt = $encodedHeader . "." . $encodedPayload . "." . $encodedSignature;
        
        // Asumsi logApiRequest terdefinisi secara global atau melalui ErrorLogger
        if (function_exists('logApiRequest')) {
            logApiRequest('JWT', 'token_generated', [
                'user_id' => $payload['user_id'] ?? null, 
                'uuid' => $payload['uuid'] ?? null,
                'jti' => $payload['jti'] ?? null
            ], 'success');
        } else {
             ErrorLogger::logSystemError('jwt_token_generated', 'JWT token generated.', [
                'user_id' => $payload['user_id'] ?? null, 
                'jti' => $payload['jti'] ?? null
            ]);
        }
        
        return $jwt;
    }
    
    public static function decode($jwt) {
        $instance = new self(); // Instansiasi kelas untuk memuat secret key dan koneksi DB

        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            ErrorLogger::logSecurityEvent('jwt_invalid_format', 'Format token tidak valid');
            throw new Exception('Format token tidak valid');
        }
        
        list($encodedHeader, $encodedPayload, $encodedSignature) = $parts;
        
        $header = json_decode(self::base64UrlDecode($encodedHeader), true);
        $payload = json_decode(self::base64UrlDecode($encodedPayload), true);
        
        // Periksa JWT ID (JTI) jika denylist berbasis database diimplementasikan
        if (isset($payload['jti']) && $instance->isTokenDenied($payload['jti'])) {
            ErrorLogger::logSecurityEvent('jwt_denylisted_attempt', 'Attempt to use denylisted token: ' . ($payload['jti'] ?? 'N/A'));
            throw new Exception('Token tidak valid atau sudah tidak berlaku.');
        }

        $signature = self::base64UrlDecode($encodedSignature);
        $expectedSignature = hash_hmac('sha256', $encodedHeader . "." . $encodedPayload, self::$secret, true);
        
        // Menggunakan hash_equals untuk perbandingan string aman
        if (!hash_equals($signature, $expectedSignature)) {
            ErrorLogger::logSecurityEvent('jwt_invalid_signature', 'JWT signature verification failed for token: ' . ($payload['jti'] ?? 'N/A'));
            throw new Exception('Token tidak valid');
        }
        
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            ErrorLogger::logSecurityEvent('jwt_expired', 'Expired JWT token used: ' . ($payload['jti'] ?? 'N/A'));
            throw new Exception('Token sudah kadaluarsa');
        }
        
        if (function_exists('logApiRequest')) {
            logApiRequest('JWT', 'token_decoded', [
                'user_id' => $payload['user_id'] ?? null, 
                'uuid' => $payload['uuid'] ?? null,
                'jti' => $payload['jti'] ?? null
            ], 'success');
        } else {
             ErrorLogger::logSystemError('jwt_token_decoded', 'JWT token decoded.', [
                'user_id' => $payload['user_id'] ?? null, 
                'jti' => $payload['jti'] ?? null
            ]);
        }
        
        return $payload;
    }
    
    /**
     * Menambahkan token ke denylist (membutuhkan database).
     * @param string $jwt Token JWT yang akan ditolak.
     * @return bool True jika berhasil ditolak, false jika gagal.
     */
    public static function denyToken($jwt) {
        $instance = new self(); // Instansiasi kelas untuk memuat secret key dan koneksi DB

        try {
            $payload = self::decode($jwt); // Decode untuk mendapatkan JTI dan EXP
            $jwtId = $payload['jti'] ?? null;
            $expiresAt = $payload['exp'] ?? time() + 3600; // Default 1 jam jika tidak ada exp
            
            if ($jwtId) {
                // --- PERBAIKAN KRITIS: Implementasi denylist berbasis database yang benar ---
                // Hapus token lama yang sudah kadaluarsa dari blacklist untuk menjaga ukuran tabel
                $stmtCleanup = $instance->db->prepare("DELETE FROM jwt_blacklist WHERE expires_at < NOW()");
                $stmtCleanup->execute();

                // Masukkan JWT ID ke tabel blacklist dengan waktu kadaluarsa token
                $stmt = $instance->db->prepare("INSERT INTO jwt_blacklist (jwt_id, expires_at) VALUES (?, FROM_UNIXTIME(?))");
                $stmt->execute([$jwtId, $expiresAt]);
                // --- AKHIR PERBAIKAN KRITIS ---
                
                ErrorLogger::logSecurityEvent('jwt_denylisted', 'Token added to denylist: ' . $jwtId);
                return true;
            }
        } catch (Exception $e) {
            ErrorLogger::logSecurityEvent('jwt_denylist_failure', 'Failed to deny token: ' . $e->getMessage() . ' for token: ' . substr($jwt, 0, 30) . '...');
        }
        return false;
    }
    
    public static function getTokenFromHeader() {
        // Menggunakan apache_request_headers() untuk kompatibilitas yang lebih luas
        // getallheaders() mungkin tidak tersedia di semua lingkungan (misalnya Nginx FPM)
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
        } else {
            $headers = [];
            foreach ($_SERVER as $name => $value) {
                if (substr($name, 0, 5) == 'HTTP_') {
                    $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
                }
            }
        }

        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }
    
    public static function getCurrentUser() {
        try {
            $token = self::getTokenFromHeader();
            if (!$token) {
                return null;
            }
            
            $payload = self::decode($token);
            return $payload;
        } catch (Exception $e) {
            ErrorLogger::logSecurityEvent('jwt_invalid_user_request', $e->getMessage());
            return null; // Mengembalikan null jika token tidak valid/kadaluarsa
        }
    }
    
    public static function requireAuth() {
        $user = self::getCurrentUser();
        if (!$user) {
            ApiResponse::unauthorized('Akses tidak diizinkan. Silakan login terlebih dahulu.');
        }
        return $user;
    }

    // Helper functions for Base64 URL Safe Encoding/Decoding
    private static function base64UrlEncode($text) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($text));
    }

    private static function base64UrlDecode($text) {
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $text));
    }
}