<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/JWT.php';

// --- START: LOGIKA PENCEGAHAN AKSES HALAMAN LOGIN UNTUK PENGGUNA YANG SUDAH TEROTENTIKASI ---

// Dapatkan token dari header Authorization
$token = null;
$headers = getallheaders();
if (isset($headers['Authorization'])) {
    $matches = [];
    if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        $token = $matches[1];
    }
}

// Cek apakah token ada dan coba verifikasi
if ($token) {
    try {
        // Menggunakan metode 'decode' dari kelas JWT untuk memverifikasi token.
        // Asumsi JWT::decode akan melempar Exception jika token tidak valid/kedaluwarsa.
        JWT::decode($token); 

        // Jika token berhasil diverifikasi, pengguna sudah terotentikasi.
        // Alihkan ke dashboard dan hentikan eksekusi skrip.
        // PENTING: SESUAIKAN URL '/dashboard' dengan jalur AKTUAL ke dashboard Anda.
        // Contoh: Jika XAMPP Anda diakses melalui http://localhost/myproject/
        // dan dashboard di http://localhost/myproject/dashboard, gunakan '/myproject/dashboard'.
        header('Location: /dashboard');
        exit(); 

    } catch (Exception $e) {
        // Token tidak valid atau kedaluwarsa.
        // Catat kesalahan untuk debugging, tapi biarkan skrip berlanjut ke logika login normal.
        // Ini memungkinkan pengguna untuk mencoba login kembali.
        error_log("Attempt to access login page with invalid/expired token: " . $e->getMessage());
    }
}

// --- END: LOGIKA PENCEGAHAN AKSES HALAMAN LOGIN UNTUK PENGGUNA YANG SUDAH TEROTENTIKASI ---


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Validate CSRF token
    CSRFProtection::requireValidToken();
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid');
    }
    
    // Sanitize input
    $input = SecurityManager::sanitizeInput($input);
    
    // Prevent brute force
    SecurityManager::preventBruteForce($_SERVER['REMOTE_ADDR'], 5, 300);
    
    // Extract data
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    // Validate input
    $validator = new Validator();
    $validator
        ->required('email', $email, 'Email wajib diisi')
        ->email('email', $email, 'Format email tidak valid')
        ->required('password', $password, 'Password wajib diisi');
    
    $validator->validate();
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Get user by email
    $stmt = $db->prepare("
        SELECT id, name, email, phone, password, status, role, email_verified_at
        FROM users 
        WHERE email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !SecurityManager::verifyPassword($password, $user['password'])) {
        logSecurityEvent('login_failed', "Failed login attempt for email: $email");
        ApiResponse::error('Email atau password tidak valid. Silakan periksa kembali kredensial Anda.');
    }
    
    // Check user status
    switch ($user['status']) {
        case 'pending_verification':
            ApiResponse::error('Akun Anda belum terverifikasi. Silakan periksa email untuk kode OTP atau minta kirim ulang kode verifikasi.');
            
        case 'suspended':
            logSecurityEvent('suspended_user_login', "Suspended user login attempt: $email");
            ApiResponse::error('Akun Anda telah dinonaktifkan. Silakan hubungi administrator untuk informasi lebih lanjut.');
            
        case 'pending_document_verification':
        case 'pending_admin_approval':
        case 'active':
        case 'verified':
            // Allow login for these statuses
            break;
            
        default:
            ApiResponse::error('Status akun tidak valid. Silakan hubungi administrator.');
    }
    
    // Generate JWT token
    $tokenPayload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'status' => $user['status']
    ];
    
    $token = JWT::encode($tokenPayload, 86400); // 24 hours
    
    // Prepare user data for response
    $userData = [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'status' => $user['status'],
        'role' => $user['role'],
        'email_verified_at' => $user['email_verified_at']
    ];
    
    logApiRequest('POST', '/api/auth/login', [
        'email' => $email,
        'user_id' => $user['id']
    ], ['success' => true]);
    
    ApiResponse::success([
        'token' => $token,
        'user' => $userData,
        'csrf_token' => CSRFProtection::generateToken()
    ], 'Login berhasil! Selamat datang di BSKI Portal.');
    
} catch (Exception $e) {
    logApiRequest('POST', '/api/auth/login', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal melakukan login: ' . $e->getMessage());
}