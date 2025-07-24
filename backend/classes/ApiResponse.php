<?php
require_once __DIR__ . '/../error_handler.php';

class ApiResponse {
    public static function success($data = null, $message = "Operasi berhasil", $code = 200) {
        http_response_code($code);
        
        $response = [
            'status' => 'success',
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        logApiRequest($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI'], null, $response);
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    public static function error($message = "Terjadi kesalahan", $code = 400, $details = null) {
        http_response_code($code);
        
        $response = [
            'status' => 'error',
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        if ($details !== null) {
            $response['details'] = $details;
        }
        
        logApiRequest($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI'], null, $response);
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    public static function validation($errors, $message = "Data tidak valid") {
        self::error($message, 422, $errors);
    }
    
    public static function unauthorized($message = "Akses tidak diizinkan") {
        logSecurityEvent('unauthorized_access', $message);
        self::error($message, 401);
    }
    
    public static function forbidden($message = "Akses ditolak") {
        logSecurityEvent('forbidden_access', $message);
        self::error($message, 403);
    }
    
    public static function notFound($message = "Data tidak ditemukan") {
        self::error($message, 404);
    }
    
    public static function serverError($message = "Terjadi kesalahan server") {
        self::error($message, 500);
    }
}