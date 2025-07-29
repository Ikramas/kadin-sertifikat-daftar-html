<?php
// File: backend/api/auth/csrf-token.php
require_once '../../error_handler.php';
require_once '../../config/cors.php'; // Pastikan CORS dimuat
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/ErrorLogger.php'; // Pastikan ErrorLogger dimuat

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // generateToken() akan memastikan sesi dimulai jika belum
    $token = CSRFProtection::generateToken();
    logApiRequest('GET', '/api/auth/csrf-token', null, 'success');
    
    ApiResponse::success([
        'csrf_token' => $token
    ], 'Token CSRF berhasil dibuat');
    
} catch (Exception $e) {
    ErrorLogger::logSystemError('csrf_token_generation', $e->getMessage());
    logApiRequest('GET', '/api/auth/csrf-token', null, $e->getMessage());
    ApiResponse::serverError('Gagal membuat token CSRF: ' . $e->getMessage());
}