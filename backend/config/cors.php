<?php
// File: backend/config/cors.php

// Memuat variabel lingkungan dari file .env (jika belum dimuat oleh config/app.php)
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
    if (class_exists('Dotenv\Dotenv') && !isset($_ENV['APP_ENV'])) {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
        $dotenv->load();
    }
}

// Mengizinkan akses dari domain frontend yang spesifik.
// Di lingkungan produksi, ganti '*' dengan domain frontend Anda yang sebenarnya.
// Contoh: 'https://your-frontend-domain.com'
// Untuk pengembangan, gunakan 'http://localhost:3000' atau port tempat React berjalan.
// APP_FRONTEND_URL akan diambil dari .env

// --- PERBAIKAN KRITIS: Gunakan variabel lingkungan untuk Origin ---
$allowedOrigin = $_ENV['APP_FRONTEND_URL'] ?? 'http://localhost/'; // Default untuk dev
if (empty($allowedOrigin)) {
    // Fallback jika tidak disetel di .env, tapi ini sebaiknya tidak terjadi di produksi
    error_log('WARNING: APP_FRONTEND_URL is not set in environment variables. Using a default for CORS.');
    $allowedOrigin = 'http://localhost/'; 
}
// --- AKHIR PERBAIKAN KRITIS ---

header("Access-Control-Allow-Origin: " . $allowedOrigin);
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Tambahkan PUT dan DELETE
header("Access-Control-Max-Age: 3600"); // Cache preflight requests for 1 hour
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-CSRF-Token");
header("Access-Control-Allow-Credentials: true"); // Penting untuk cookie/sesi

// Tangani permintaan OPTIONS (preflight request untuk CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}