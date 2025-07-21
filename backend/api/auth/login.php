<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/JWT.php';

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