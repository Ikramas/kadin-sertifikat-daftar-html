<?php
// Router Utama - Semua request akan masuk ke sini

// Definisikan ROOT_PATH agar semua file bisa diakses secara absolut
define('ROOT_PATH', dirname(__DIR__) . '/');

// 1. Muat semua file penting sekali saja menggunakan ROOT_PATH
require_once ROOT_PATH . 'error_handler.php';
require_once ROOT_PATH . 'config/cors.php';
require_once ROOT_PATH . 'classes/ApiResponse.php'; 

// Autoload semua kelas
spl_autoload_register(function ($class) {
    $file = ROOT_PATH . 'src/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require $file;
    }
    // Tambahkan juga autoload untuk classes/
    $classFile = ROOT_PATH . 'classes/' . basename(str_replace('\\', '/', $class)) . '.php';
    if (file_exists($classFile)) {
        require $classFile;
    }
});


// 2. Analisa URL untuk menentukan rute
$requestUri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$parts = explode('/', $requestUri);

// Kita ambil bagian setelah 'api/'
$routePrefix = 'api/';
$routePath = substr($requestUri, strpos($requestUri, $routePrefix) + strlen($routePrefix));

// 3. Tentukan Controller dan Method berdasarkan Rute
$method = $_SERVER['REQUEST_METHOD'];

// Rute untuk Otentikasi
if (strpos($routePath, 'auth/') === 0) {
    $controller = new AuthController(); // Gunakan tanpa namespace jika tidak didefinisikan
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
        case 'logout':
            if ($method === 'POST') $controller->logout();
            break;
        case 'resend-otp':
            if ($method === 'POST') $controller->resendOtp();
            break;
        case 'csrf-token':
            if ($method === 'GET') $controller->getCsrfToken();
            break;
        case 'refresh-token':
            if ($method === 'POST') $controller->refreshToken();
            break;
        default:
            ApiResponse::notFound('Endpoint tidak ditemukan');
            break;
    }
}
// Rute untuk Profil Pengguna
elseif (strpos($routePath, 'users/') === 0) {
    $controller = new UserController();
    $action = substr($routePath, strlen('users/'));

    switch ($action) {
        case 'profile':
            if ($method === 'GET') $controller->getProfile();
            break;
        case 'update-profile':
            if ($method === 'POST' || $method === 'PUT') $controller->updateProfile();
            break;
        case 'change-password':
            if ($method === 'POST') $controller->changePassword();
            break;
        default:
            ApiResponse::notFound('Endpoint tidak ditemukan');
            break;
    }
}
// Rute untuk Dokumen
elseif (strpos($routePath, 'documents/') === 0) {
    $controller = new DocumentController();
    $action = substr($routePath, strlen('documents/'));

    switch ($action) {
        case 'upload':
            if ($method === 'POST') $controller->upload();
            break;
        case 'download':
            if ($method === 'GET') $controller->download();
            break;
        case 'delete.php': // Sesuaikan jika Anda punya controller DocumentController->delete()
            if ($method === 'POST') $controller->delete();
            break;
        case 'get_user_documents.php': 
            if ($method === 'GET') $controller->getUserDocuments();
            break;
        case 'list-by-category.php': 
             if ($method === 'GET') $controller->listByCategory();
             break;
        default:
            ApiResponse::notFound('Endpoint tidak ditemukan');
            break;
    }
}
// Rute untuk Permohonan SBU
elseif (strpos($routePath, 'applications/') === 0) {
    $controller = new ApplicationController();
    $action = substr($routePath, strlen('applications/'));

    switch ($action) {
        case 'create':
            if ($method === 'POST') $controller->create();
            break;
        case 'list':
            if ($method === 'GET') $controller->listAll();
            break;
        case 'get_detail':
            if ($method === 'GET') $controller->getDetail();
            break;
        case 'submit':
            if ($method === 'POST') $controller->submit();
            break;
        case 'approve': // Tambahkan rute untuk approval admin
            if ($method === 'POST') $controller->approve();
            break;
        default:
            ApiResponse::notFound('Endpoint tidak ditemukan');
            break;
    }
}
// Rute untuk Registrasi Awal (initial-document-submit)
elseif ($routePath === 'registrations/initial-document-submit' && $method === 'POST') {
    $controller = new RegistrationController();
    $controller->initialDocumentSubmit();
}
// Rute untuk Transaksi
elseif (strpos($routePath, 'transactions/') === 0) {
    $controller = new TransactionController();
    $action = substr($routePath, strlen('transactions/'));

    switch ($action) {
        case 'list':
            if ($method === 'GET') $controller->listTransactions();
            break;
        case 'generate_invoice_pdf':
            if ($method === 'GET') $controller->generateInvoicePdf();
            break;
        default:
            ApiResponse::notFound('Endpoint tidak ditemukan');
            break;
    }
}
// Rute untuk Sertifikat
elseif (strpos($routePath, 'certificates/') === 0) {
    $controller = new CertificateController();
    $action = substr($routePath, strlen('certificates/'));

    switch ($action) {
        case 'list':
            if ($method === 'GET') $controller->listCertificates();
            break;
        case 'generate_pdf': // Tambahkan rute untuk generate PDF sertifikat
            if ($method === 'GET') $controller->generatePdf();
            break;
        default:
            ApiResponse::notFound('Endpoint tidak ditemukan');
            break;
    }
}
// Rute untuk Notifikasi
elseif (strpos($routePath, 'notifications/') === 0) {
    $controller = new NotificationController();
    $action = substr($routePath, strlen('notifications/'));

    switch ($action) {
        case 'list':
            if ($method === 'GET') $controller->listNotifications();
            break;
        case 'mark-read':
            if ($method === 'POST') $controller->markAsRead();
            break;
        case 'mark-all-read':
            if ($method === 'POST') $controller->markAllAsRead();
            break;
        case 'delete':
            if ($method === 'DELETE') $controller->deleteNotification();
            break;
        default:
            ApiResponse::notFound('Endpoint tidak ditemukan');
            break;
    }
}
// Rute untuk Analytics (jika ada API backend)
elseif (strpos($routePath, 'analytics/') === 0) {
    $controller = new AnalyticsController(); // Asumsi Anda punya controller ini
    $action = substr($routePath, strlen('analytics/'));

    switch ($action) {
        case 'stats':
            if ($method === 'GET') $controller->getDashboardStats();
            break;
        default:
            ApiResponse::notFound('Endpoint tidak ditemukan');
            break;
    }
}
// Rute untuk Proxy Wilayah
elseif (strpos($routePath, 'wilayah-proxy.php') === 0) { 
    require_once __DIR__ . '/wilayah-proxy.php'; 
}
// Catch-all untuk endpoint yang tidak ditemukan
else {
    ApiResponse::notFound('Endpoint tidak ditemukan');
}