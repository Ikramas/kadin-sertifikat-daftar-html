<?php
// Router Utama - Semua request akan masuk ke sini

// 1. Muat semua file penting sekali saja
require_once __DIR__ . '/../error_handler.php';
require_once __DIR__ . '/../config/cors.php';

// Autoload semua kelas dari folder 'src'
spl_autoload_register(function ($class) {
    $file = __DIR__ . '/../src/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

use Lib\ApiResponse;

// 2. Analisa URL untuk menentukan rute
$requestUri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$parts = explode('/', $requestUri);
// Contoh: /backend/api/auth/login -> ['backend', 'api', 'auth', 'login']

// Kita ambil bagian setelah 'api/'
$routePrefix = 'api/';
$routePath = substr($requestUri, strpos($requestUri, $routePrefix) + strlen($routePrefix));

// 3. Tentukan Controller dan Method berdasarkan Rute
$method = $_SERVER['REQUEST_METHOD'];

// Rute untuk Otentikasi
if (strpos($routePath, 'auth/') === 0) {
    $controller = new Controllers\AuthController();
    $action = substr($routePath, strlen('auth/'));

    switch ($action) {
        case 'register':
            if ($method === 'POST') $controller->register();
            break;
        case 'login':
            if ($method === 'POST') $controller->login();
            break;
        case 'verify-otp':
            if ($method === 'POST') $controller->verifyOtp();
            break;
        // Tambahkan rute auth lainnya di sini (logout, resend-otp, dll)
        default:
            ApiResponse::notFound('Endpoint tidak ditemukan');
            break;
    }
} 
// Rute untuk Profil Pengguna
elseif ($routePath === 'users/profile' && $method === 'GET') {
    $controller = new Controllers\UserController();
    $controller->getProfile();
}
// Tambahkan blok 'else if' untuk rute lain (applications, documents, dll)
else {
    ApiResponse::notFound('Endpoint tidak ditemukan');
}