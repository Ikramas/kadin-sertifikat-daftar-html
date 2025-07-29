<?php
// File: backend/api/auth/verify-otp.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/OTPManager.php';
require_once '../../classes/ErrorLogger.php'; 

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Validate CSRF token
    CSRFProtection::requireValidToken();
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid', 400); 
    }
    
    // Sanitize input
    $input = SecurityManager::sanitizeInput($input);
    
    // Prevent brute force for OTP verification attempts (per IP or email)
    SecurityManager::preventBruteForce($_SERVER['REMOTE_ADDR'], 'otp_verify_attempt_ip', 10, 300); // Batas per IP
    SecurityManager::preventBruteForce($input['email'] ?? 'unknown_email', 'otp_verify_attempt_email', 5, 300); // Batas per email
    
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
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        ApiResponse::error('Email tidak ditemukan. Silakan periksa kembali atau daftar terlebih dahulu.', 404); 
    }
    
    if ($user['status'] !== 'pending_verification') {
        ApiResponse::error('Akun sudah terverifikasi atau dalam status yang tidak memerlukan verifikasi OTP.', 403); 
    }
    
    // Verify OTP
    $otpManager = new OTPManager($db);
    
    try {
        $otpManager->verifyOTP($email, $otp);
        // Jika OTP berhasil diverifikasi, hapus semua log percobaan untuk email ini
        $stmtCleanup = $db->prepare("DELETE FROM security_logs WHERE identifier = ? AND type IN ('otp_attempt', 'otp_attempt_lockout', 'otp_verify_attempt_email')");
        $stmtCleanup->execute([$email]);

    } catch (Exception $e) {
        // Tangkap Exception dari verifyOTP dan log
        ErrorLogger::logSystemError('otp_verification_failed', $e->getMessage(), ['email' => $email, 'otp_provided' => $otp]);
        ApiResponse::error($e->getMessage(), 400); 
    }
    
    // Update user status
    $stmt = $db->prepare("UPDATE users SET status = 'pending_document_verification', email_verified_at = NOW(), updated_at = NOW() WHERE email = ?");
    $stmt->execute([$email]);
    
    // Hapus data cooldown OTP dari sesi setelah verifikasi berhasil (jika masih ada)
    if (session_status() == PHP_SESSION_ACTIVE && isset($_SESSION['otp_spam_' . $email])) {
        unset($_SESSION['otp_spam_' . $email]);
    }

    logApiRequest('POST', '/api/auth/verify-otp', [
        'email' => $email,
        'user_id' => $user['id']
    ], 'success');
    
    ApiResponse::success([
        'email' => $email,
        'status' => 'verified',
        'next_step' => 'document_registration',
        'csrf_token' => CSRFProtection::generateToken() 
    ], 'Verifikasi OTP berhasil! Anda sekarang dapat login dan melengkapi dokumen registrasi perusahaan.');
    
} catch (Exception $e) {
    ErrorLogger::logSystemError('auth_verify_otp_failed', $e->getMessage(), ['input' => $input ?? null]);
    logApiRequest('POST', '/api/auth/verify-otp', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal melakukan verifikasi OTP: ' . $e->getMessage());
}