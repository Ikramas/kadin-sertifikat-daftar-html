<?php
require_once __DIR__ . '/../error_handler.php';

class JWT {
    private static $secret = 'your-very-secure-secret-key-change-in-production';
    private static $denylist = [];
    
    public static function encode($payload, $exp = 3600) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        $payload['iat'] = time();
        $payload['exp'] = time() + $exp;
        // payload sudah berisi user_id dan sekarang juga uuid dari register.php
        $payload = json_encode($payload);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        $jwt = $base64Header . "." . $base64Payload . "." . $base64Signature;
        
        logApiRequest('JWT', 'token_generated', ['user_id' => $payload['user_id'] ?? null, 'uuid' => $payload['uuid'] ?? null]);
        
        return $jwt;
    }
    
    public static function decode($jwt) {
        if (in_array($jwt, self::$denylist)) {
            logSecurityEvent('jwt_denylist_attempt', 'Attempt to use denylisted token');
            throw new Exception('Token tidak valid');
        }
        
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            logSecurityEvent('jwt_invalid_format', 'Invalid JWT format');
            throw new Exception('Format token tidak valid');
        }
        
        list($base64Header, $base64Payload, $base64Signature) = $parts;
        
        $header = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Header)), true);
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload)), true);
        
        $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Signature));
        $expectedSignature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secret, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            logSecurityEvent('jwt_invalid_signature', 'JWT signature verification failed');
            throw new Exception('Token tidak valid');
        }
        
        if ($payload['exp'] < time()) {
            logSecurityEvent('jwt_expired', 'Expired JWT token used');
            throw new Exception('Token sudah kadaluarsa');
        }
        
        logApiRequest('JWT', 'token_decoded', ['user_id' => $payload['user_id'] ?? null, 'uuid' => $payload['uuid'] ?? null]);
        
        return $payload;
    }
    
    public static function denyToken($jwt) {
        self::$denylist[] = $jwt;
        logSecurityEvent('jwt_denylisted', 'Token added to denylist');
    }
    
    public static function getTokenFromHeader() {
        $headers = getallheaders();
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
            logSecurityEvent('jwt_invalid_user_request', $e->getMessage());
            return null;
        }
    }
    
    public static function requireAuth() {
        $user = self::getCurrentUser();
        if (!$user) {
            ApiResponse::unauthorized('Akses tidak diizinkan. Silakan login terlebih dahulu.');
        }
        return $user;
    }
}