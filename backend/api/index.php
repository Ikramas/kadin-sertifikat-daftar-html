<?php
// File: backend/api/index.php
// Router Utama - Semua request akan masuk ke sini

// Definisikan ROOT_PATH agar semua file bisa diakses secara absolut
// ROOT_PATH akan menunjuk ke folder 'backend/'
define('ROOT_PATH', dirname(__DIR__) . '/');

// 1. Muat konfigurasi aplikasi (termasuk variabel lingkungan)
require_once ROOT_PATH . 'config/app.php'; 

// 2. Muat semua file penting sekali saja
// require_once ROOT_PATH . 'error_handler.php'; // Sementara komentari atau pastikan ini sangat minimal jika masih crash
require_once ROOT_PATH . 'config/cors.php';
require_once ROOT_PATH . 'config/database.php'; // Kelas Database
require_once ROOT_PATH . 'classes/ApiResponse.php'; // Kelas ApiResponse
require_once ROOT_PATH . 'classes/ErrorLogger.php'; // Muat ErrorLogger secara eksplisit di sini

// --- PERBAIKAN: Pastikan ErrorLogger diinisialisasi untuk mengatur $logDir dsb. ---
new ErrorLogger(); // Ini akan memicu constructor ErrorLogger
// --- AKHIR PERBAIKAN ---

// Fungsi global logging (jika masih diperlukan, pastikan tidak crash)
if (!function_exists('logApiRequest')) {
    function logApiRequest($method, $uri, $input_summary = null, $response_status = null, $userId = null) {
        // ErrorLogger::logApiRequest($method, $uri, $input_summary, $response_status, $userId); // Komentari sementara jika masih crash
    }
}
if (!function_exists('logSecurityEvent')) {
    function logSecurityEvent($type, $message, $details = null) {
        // ErrorLogger::logSecurityEvent($type, $message, $details); // Komentari sementara jika masih crash
    }
}


// Autoload semua kelas
spl_autoload_register(function ($class) {
    // Gunakan autoloader Composer jika ada
    if (file_exists(ROOT_PATH . 'vendor/autoload.php')) {
        require_once ROOT_PATH . 'vendor/autoload.php';
    }

    $classPath = ROOT_PATH . 'classes/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($classPath)) {
        require_once $classPath;
        return;
    }
    // Jika ada kelas controller di subfolder api/controllers/
    $controllerPath = ROOT_PATH . 'api/controllers/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($controllerPath)) {
        require_once $controllerPath;
        return;
    }
    // Fallback jika tidak ditemukan (opsional, untuk debugging)
    // error_log("Class not found: " . $class . " at path: " . $classPath);
});

// 2. Analisa URL untuk menentukan rute
$requestUri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

// --- PERBAIKAN: Mengambil apiSegment secara dinamis ---
// Asumsi: File index.php ini berada di folder '/backend/api/'
// Kita perlu tahu posisi 'api' di URL agar bisa memotong path dengan benar
$pathSegments = explode('/', $requestUri);
$apiSegmentIndex = array_search('api', $pathSegments);

$routePath = '';
if ($apiSegmentIndex !== false && isset($pathSegments[$apiSegmentIndex + 1])) {
    // Ambil semua segmen setelah 'api/' dan gabungkan
    $routePath = implode('/', array_slice($pathSegments, $apiSegmentIndex + 1));
}
// --- AKHIR PERBAIKAN ---

// Jika routePath masih mengandung ekstensi .php, hapus (untuk internal routing)
if (strpos($routePath, '.php') !== false) {
    $routePath = str_replace('.php', '', $routePath);
}

// Pisahkan routePath menjadi segmen
$routeSegments = explode('/', $routePath);
$mainSegment = $routeSegments[0] ?? null;
$actionSegment = $routeSegments[1] ?? null; // Digunakan untuk action atau ID
$idSegment = $routeSegments[2] ?? null;     // Digunakan untuk ID jika ada

// 3. Tentukan Controller dan Method berdasarkan Rute
$method = $_SERVER['REQUEST_METHOD'];

switch ($mainSegment) {
    case 'auth':
        switch ($actionSegment) {
            case 'register':
                if ($method === 'POST') require_once ROOT_PATH . 'api/auth/register.php';
                break;
            case 'login':
                if ($method === 'POST') require_PATH . 'api/auth/login.php';
                break;
            case 'verify-otp':
                if ($method === 'POST') require_once ROOT_PATH . 'api/auth/verify-otp.php';
                break;
            case 'logout':
                if ($method === 'POST') require_once ROOT_PATH . 'api/auth/logout.php';
                break;
            case 'resend-otp':
                if ($method === 'POST') require_once ROOT_PATH . 'api/auth/resend-otp.php';
                break;
            case 'csrf-token':
                if ($method === 'GET') require_once ROOT_PATH . 'api/auth/csrf-token.php';
                break;
            case 'refresh-token':
                if ($method === 'POST') require_once ROOT_PATH . 'api/auth/refresh-token.php';
                break;
            // --- PERBAIKAN KRITIS: Tambahkan case untuk check_registration_data ---
            case 'check_registration_data':
                if ($method === 'POST') require_once ROOT_PATH . 'api/auth/check_registration_data.php';
                break;
            // --- AKHIR PERBAIKAN KRITIS ---
            default:
                ApiResponse::notFound('Endpoint autentikasi tidak ditemukan');
        }
        break;

    case 'users':
        switch ($actionSegment) {
            case 'profile':
                if ($method === 'GET') require_once ROOT_PATH . 'api/users/profile.php';
                break;
            case 'update-profile':
                if ($method === 'POST' || $method === 'PUT') require_once ROOT_PATH . 'api/users/update-profile.php';
                break;
            case 'change-password':
                if ($method === 'POST') require_once ROOT_PATH . 'api/users/change-password.php';
                break;
            case 'list': // Tambahkan rute ini
                if ($method === 'GET') require_once ROOT_PATH . 'api/users/list.php';
                break;
            default:
                ApiResponse::notFound('Endpoint pengguna tidak ditemukan');
        }
        break;

    case 'companies': // Tambahkan main segment untuk companies
        switch ($actionSegment) {
            case 'list': // Tambahkan rute ini
                if ($method === 'GET') require_once ROOT_PATH . 'api/companies/list.php';
                break;
            case 'update_status': // Tambahkan rute ini
                if ($method === 'POST') require_once ROOT_PATH . 'api/companies/update_status.php';
                break;
            default:
                ApiResponse::notFound('Endpoint perusahaan tidak ditemukan');
        }
        break;

    case 'documents':
        switch ($actionSegment) {
            case 'upload':
                if ($method === 'POST') require_once ROOT_PATH . 'api/documents/upload.php';
                break;
            case 'download':
                if ($method === 'GET') require_once ROOT_PATH . 'api/documents/download.php';
                break;
            case 'delete': 
                if ($method === 'DELETE') require_once ROOT_PATH . 'api/documents/delete.php';
                break;
            case 'get_user_documents': 
                if ($method === 'GET') require_once ROOT_PATH . 'api/documents/get_user_documents.php';
                break;
            case 'list-by-category': 
                if ($method === 'GET') require_once ROOT_PATH . 'api/documents/list-by-category.php';
                break;
            default:
                ApiResponse::notFound('Endpoint dokumen tidak ditemukan');
        }
        break;

    case 'applications':
        switch ($actionSegment) {
            case 'create':
                if ($method === 'POST') require_once ROOT_PATH . 'api/applications/create.php';
                break;
            case 'list':
                if ($method === 'GET') require_once ROOT_PATH . 'api/applications/list.php';
                break;
            case 'detail': 
                if ($method === 'GET' && isset($routeSegments[2])) {
                    $_GET['code_reg'] = $routeSegments[2]; 
                    require_once ROOT_PATH . 'api/applications/get_detail.php';
                } else if ($method === 'GET' && isset($_GET['code_reg'])) {
                    require_once ROOT_PATH . 'api/applications/get_detail.php';
                }
                else ApiResponse::error('Parameter code_reg tidak disediakan', 400);
                break;
            case 'submit':
                if ($method === 'POST') require_once ROOT_PATH . 'api/applications/submit.php';
                break;
            case 'approve':
                if ($method === 'POST') require_once ROOT_PATH . 'api/applications/approve.php';
                break;
            case 'reject': 
                if ($method === 'POST') require_once ROOT_PATH . 'api/applications/reject.php'; 
                break;
            default:
                ApiResponse::notFound('Endpoint permohonan tidak ditemukan');
        }
        break;

    case 'registrations': 
        if ($actionSegment === 'initial-document-submit' && $method === 'POST') {
            require_once ROOT_PATH . 'api/registrations/initial-document-submit.php';
        } else {
            ApiResponse::notFound('Endpoint registrasi tidak ditemukan');
        }
        break;

    case 'transactions':
        switch ($actionSegment) {
            case 'list':
                if ($method === 'GET') require_once ROOT_PATH . 'api/transactions/list.php';
                break;
            case 'generate_invoice_pdf':
                if ($method === 'GET') require_once ROOT_PATH . 'api/transactions/generate_invoice_pdf.php';
                break;
            case 'update_status': 
                if ($method === 'POST') {
                    require_once ROOT_PATH . 'api/transactions/update_status.php';
                }
                break;
            case 'create_invoice': 
                if ($method === 'POST') {
                    require_once ROOT_PATH . 'api/transactions/create_invoice.php';
                }
                break;
            default:
                ApiResponse::notFound('Endpoint transaksi tidak ditemukan');
        }
        break;

    case 'certificates':
        switch ($actionSegment) {
            case 'list':
                if ($method === 'GET') require_once ROOT_PATH . 'api/certificates/list.php';
                break;
            case 'generate_pdf':
                if ($method === 'GET') require_once ROOT_PATH . 'api/certificates/generate_pdf.php';
                break;
            default:
                ApiResponse::notFound('Endpoint sertifikat tidak ditemukan');
        }
        break;

    case 'notifications':
        switch ($actionSegment) {
            case 'list':
                if ($method === 'GET') require_once ROOT_PATH . 'api/notifications/list.php';
                break;
            case 'mark-read':
                if ($method === 'POST') require_once ROOT_PATH . 'api/notifications/mark-read.php';
                break;
            case 'mark-all-read':
                if ($method === 'POST') require_once ROOT_PATH . 'api/notifications/mark-all-read.php';
                break;
            case 'delete':
                if ($method === 'DELETE') require_once ROOT_PATH . 'api/notifications/delete.php';
                break;
            default:
                ApiResponse::notFound('Endpoint notifikasi tidak ditemukan');
        }
        break;

    case 'analytics':
        switch ($actionSegment) {
            case 'stats':
                if ($method === 'GET') require_once ROOT_PATH . 'api/dashboard/stats.php'; 
                break;
            default:
                ApiResponse::notFound('Endpoint analitik tidak ditemukan');
        }
        break;
        
    case 'settings':
        switch ($actionSegment) {
            case 'get':
                if ($method === 'GET') require_once ROOT_PATH . 'api/settings/get.php';
                break;
            case 'update':
                if ($method === 'POST') require_once ROOT_PATH . 'api/settings/update.php';
                break;
            default:
                ApiResponse::notFound('Endpoint pengaturan tidak ditemukan');
        }
        break;

    case 'wilayah-proxy': 
        require_once __DIR__ . '/wilayah-proxy.php';
        break;

    case 'logs': 
        if ($actionSegment === 'frontend-error' && $method === 'POST') {
            require_once __DIR__ . '/logs/frontend-error.php';
        } else {
            ApiResponse::notFound('Endpoint log tidak ditemukan');
        }
        break;

    // Catch-all untuk endpoint yang tidak ditemukan
    default:
        ApiResponse::notFound('Endpoint tidak ditemukan');
        break;
}
