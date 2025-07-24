<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/OTPManager.php';

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
    SecurityManager::preventBruteForce($_SERVER['REMOTE_ADDR'] . '_otp', 10, 300);
    
    // Extract data
    $email = $input['email'] ?? '';
    $otp = $input['otp'] ?? '';
    
    // Validate input
    $validator = new Validator();
    $validator
        ->required('email', $email, 'Email wajib diisi')
        ->email('email', $email, 'Format email tidak valid')
        ->required('otp', $otp, 'Kode OTP wajib diisi')
        ->minLength('otp', $otp, 6, 'Kode OTP harus 6 digit')
        ->maxLength('otp', $otp, 6, 'Kode OTP harus 6 digit')
        ->numeric('otp', $otp, 'Kode OTP harus berupa angka');
    
    $validator->validate();
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if user exists
    $stmt = $db->prepare("SELECT id, name, status FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        ApiResponse::error('Email tidak ditemukan. Silakan periksa kembali atau daftar terlebih dahulu.');
    }
    
    if ($user['status'] !== 'pending_verification') {
        ApiResponse::error('Akun sudah terverifikasi atau dalam status yang tidak memerlukan verifikasi OTP.');
    }
    
    // Verify OTP
    $otpManager = new OTPManager($db);
    
    try {
        $otpManager->verifyOTP($email, $otp);
    } catch (Exception $e) {
        ApiResponse::error($e->getMessage());
    }
    
    // Update user status
    $stmt = $db->prepare("UPDATE users SET status = 'pending_document_verification', email_verified_at = NOW(), updated_at = NOW() WHERE email = ?");
    $stmt->execute([$email]);
    
    logApiRequest('POST', '/api/auth/verify-otp', [
        'email' => $email,
        'user_id' => $user['id']
    ], ['success' => true]);
    
    ApiResponse::success([
        'email' => $email,
        'status' => 'verified',
        'next_step' => 'document_registration'
    ], 'Verifikasi OTP berhasil! Anda sekarang dapat login dan melengkapi dokumen registrasi perusahaan.');
    
} catch (Exception $e) {
    logApiRequest('POST', '/api/auth/verify-otp', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal melakukan verifikasi OTP: ' . $e->getMessage());
}