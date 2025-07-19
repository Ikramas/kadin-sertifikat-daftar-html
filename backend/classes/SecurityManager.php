<?php
require_once __DIR__ . '/../error_handler.php';

class SecurityManager {
    private static $loginAttempts = [];
    private static $otpAttempts = [];
    
    public static function preventBruteForce($identifier, $maxAttempts = 5, $lockoutTime = 300) {
        $key = 'login_' . $identifier;
        
        if (!isset(self::$loginAttempts[$key])) {
            self::$loginAttempts[$key] = [];
        }
        
        // Clean old attempts
        $currentTime = time();
        self::$loginAttempts[$key] = array_filter(self::$loginAttempts[$key], function($timestamp) use ($currentTime, $lockoutTime) {
            return ($currentTime - $timestamp) < $lockoutTime;
        });
        
        if (count(self::$loginAttempts[$key]) >= $maxAttempts) {
            $remainingTime = $lockoutTime - ($currentTime - min(self::$loginAttempts[$key]));
            logSecurityEvent('brute_force_attempt', "IP: {$identifier}, Remaining time: {$remainingTime}s");
            ApiResponse::error("Terlalu banyak percobaan login. Coba lagi dalam " . ceil($remainingTime/60) . " menit.", 429);
        }
        
        self::$loginAttempts[$key][] = $currentTime;
    }
    
    public static function preventOtpSpam($email, $maxAttempts = 3, $lockoutTime = 900) {
        $key = 'otp_' . $email;
        
        if (!isset($_SESSION[$key])) {
            $_SESSION[$key] = [];
        }
        
        // Clean old attempts
        $currentTime = time();
        $_SESSION[$key] = array_filter($_SESSION[$key], function($timestamp) use ($currentTime, $lockoutTime) {
            return ($currentTime - $timestamp) < $lockoutTime;
        });
        
        if (count($_SESSION[$key]) >= $maxAttempts) {
            $remainingTime = $lockoutTime - ($currentTime - min($_SESSION[$key]));
            logSecurityEvent('otp_spam_attempt', "Email: {$email}, Remaining time: {$remainingTime}s");
            ApiResponse::error("Terlalu banyak permintaan OTP. Coba lagi dalam " . ceil($remainingTime/60) . " menit.", 429);
        }
        
        $_SESSION[$key][] = $currentTime;
        return true;
    }
    
    public static function getOtpCooldown($email) {
        $key = 'otp_' . $email;
        
        if (!isset($_SESSION[$key]) || empty($_SESSION[$key])) {
            return 0;
        }
        
        $lastAttempt = max($_SESSION[$key]);
        $timeSinceLastAttempt = time() - $lastAttempt;
        
        // Different cooldown periods based on attempt count
        $attemptCount = count($_SESSION[$key]);
        if ($attemptCount == 1) {
            $cooldown = 30; // 30 seconds for first resend
        } elseif ($attemptCount == 2) {
            $cooldown = 300; // 5 minutes for second resend
        } else {
            $cooldown = 900; // 15 minutes for subsequent resends
        }
        
        $remainingCooldown = max(0, $cooldown - $timeSinceLastAttempt);
        return $remainingCooldown;
    }
    
    public static function sanitizeInput($input) {
        if (is_array($input)) {
            return array_map([self::class, 'sanitizeInput'], $input);
        }
        
        if (is_string($input)) {
            // Remove potential XSS
            $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
            // Remove potential SQL injection characters
            $input = str_replace(['<script', '</script>', 'javascript:', 'vbscript:', 'onload='], '', $input);
            return trim($input);
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
        if (!isset($file['error']) || is_array($file['error'])) {
            throw new RuntimeException('Parameter file tidak valid');
        }
        
        switch ($file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                throw new RuntimeException('File tidak ditemukan');
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                throw new RuntimeException('File terlalu besar (maksimal 5MB)');
            default:
                throw new RuntimeException('Terjadi kesalahan saat upload file');
        }
        
        if ($file['size'] > $maxSize) {
            throw new RuntimeException('File terlalu besar (maksimal 5MB)');
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
            throw new RuntimeException('Tipe file tidak diizinkan. Hanya PDF, JPG, JPEG, PNG yang diperbolehkan');
        }
        
        return true;
    }
}