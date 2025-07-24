<?php
require_once __DIR__ . '/../error_handler.php';

class CSRFProtection {
    public static function generateToken() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        
        return $token;
    }
    
    public static function getToken() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_token'])) {
            return self::generateToken();
        }
        
        return $_SESSION['csrf_token'];
    }
    
    public static function validateToken($token) {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_token']) || !$token) {
            return false;
        }
        
        return hash_equals($_SESSION['csrf_token'], $token);
    }
    
    public static function requireValidToken() {
        $token = null;
        
        // Check for token in headers
        if (isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
            $token = $_SERVER['HTTP_X_CSRF_TOKEN'];
        }
        // Check for token in POST data
        elseif (isset($_POST['csrf_token'])) {
            $token = $_POST['csrf_token'];
        }
        // Check for token in JSON body
        else {
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['csrf_token'])) {
                $token = $input['csrf_token'];
            }
        }
        
        if (!self::validateToken($token)) {
            logSecurityEvent('csrf_token_invalid', 'Invalid CSRF token provided');
            ApiResponse::forbidden('Token keamanan tidak valid. Silakan refresh halaman dan coba lagi.');
        }
        
        return true;
    }
}