<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/ApiResponse.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    $token = CSRFProtection::getToken();
    logApiRequest('GET', '/api/auth/csrf-token', null, ['token_generated' => true]);
    
    ApiResponse::success([
        'csrf_token' => $token
    ], 'Token CSRF berhasil dibuat');
    
} catch (Exception $e) {
    logApiRequest('GET', '/api/auth/csrf-token', null, $e->getMessage());
    ApiResponse::serverError('Gagal membuat token CSRF: ' . $e->getMessage());
}