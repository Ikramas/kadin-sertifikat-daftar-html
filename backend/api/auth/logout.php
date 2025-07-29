<?php
// File: backend/api/auth/logout.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; 

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Get current user from JWT
    $user = JWT::getCurrentUser(); 
    
    $userId = $user['user_id'] ?? 'N/A';

    if ($user) {
        // Get the token from header and add it to denylist
        $token = JWT::getTokenFromHeader();
        if ($token) {
            JWT::denyToken($token); // Memanggil denyToken untuk invalidate JWT (membutuhkan implementasi denylist persisten)
        }
        
        logApiRequest('POST', '/api/auth/logout', ['user_id' => $userId], 'success');
    } else {
        // Jika tidak ada user (misal token sudah expired/invalid sebelumnya), tetap proses logout
        ErrorLogger::logSecurityEvent('logout_no_valid_token', 'Logout request received without a valid token.', ['ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'N/A']);
    }
    
    // Destroy session (jika menggunakan sesi untuk CSRF atau sejenisnya)
    if (session_status() == PHP_SESSION_ACTIVE) {
        session_destroy();
        session_unset();
        setcookie(session_name(), '', time() - 3600, '/'); // Hapus cookie sesi
    }
    
    ApiResponse::success(null, 'Logout berhasil. Terima kasih telah menggunakan BSKI Portal.');
    
} catch (Exception $e) {
    ErrorLogger::logSystemError('auth_logout_failed', $e->getMessage(), ['user_id' => $userId]);
    logApiRequest('POST', '/api/auth/logout', ['user_id' => $userId], $e->getMessage());
    ApiResponse::serverError('Gagal melakukan logout: ' . $e->getMessage());
}