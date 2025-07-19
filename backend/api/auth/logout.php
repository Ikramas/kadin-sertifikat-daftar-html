<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Get current user from JWT
    $user = JWT::getCurrentUser();
    
    if ($user) {
        // Get the token and add it to denylist
        $token = JWT::getTokenFromHeader();
        if ($token) {
            JWT::denyToken($token);
        }
        
        logApiRequest('POST', '/api/auth/logout', ['user_id' => $user['user_id']], ['success' => true]);
    }
    
    // Destroy session
    if (session_status() == PHP_SESSION_ACTIVE) {
        session_destroy();
    }
    
    ApiResponse::success(null, 'Logout berhasil. Terima kasih telah menggunakan BSKI Portal.');
    
} catch (Exception $e) {
    logApiRequest('POST', '/api/auth/logout', null, $e->getMessage());
    ApiResponse::serverError('Gagal melakukan logout: ' . $e->getMessage());
}