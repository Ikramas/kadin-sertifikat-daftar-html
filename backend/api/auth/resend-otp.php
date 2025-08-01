<?php
// File: backend/api/auth/resend-otp.php
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
    
    // Extract data
    $email = $input['email'] ?? '';
    
    // Validate input
    $validator = new Validator();
    $validator
        ->required('email', $email, 'Email wajib diisi')
        ->email('email', $email, 'Format email tidak valid');
    
    $validator->validate();
    
    // Check cooldown period
    $cooldown = SecurityManager::getOtpCooldown($email);
    if ($cooldown > 0) {
        $minutes = floor($cooldown / 60);
        $seconds = $cooldown % 60;
        
        $timeMessage = '';
        if ($minutes > 0) {
            $timeMessage .= $minutes . " menit";
        }
        if ($seconds > 0 || empty($timeMessage)) { 
            $timeMessage .= ($minutes > 0 ? " dan " : "") . $seconds . " detik";
        }
        
        ApiResponse::error("Mohon tunggu $timeMessage sebelum meminta kode OTP baru.", 429, [
            'cooldown_seconds' => $cooldown,
            'wait_time' => $cooldown
        ]);
    }
    
    // Prevent OTP spam (ini akan mencatat upaya dan meningkatkan cooldown)
    SecurityManager::preventOtpSpam($email);
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if user exists and needs OTP
    $stmt = $db->prepare("SELECT id, name, status FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        ApiResponse::error('Email tidak ditemukan. Silakan periksa kembali atau daftar terlebih dahulu.', 404); 
    }
    
    if ($user['status'] !== 'pending_verification') {
        ApiResponse::error('Akun tidak memerlukan verifikasi OTP atau sudah terverifikasi.', 403); 
    }
    
    // Generate and send new OTP
    $otpManager = new OTPManager($db);
    
    try {
        $otp = $otpManager->generateOTP($email);
        $otpManager->sendOTP($email, $otp, $user['name']);
    } catch (Exception $e) {
        ErrorLogger::logSystemError('otp_resend_email_failed', $e->getMessage(), ['email' => $email]);
        ApiResponse::serverError('Gagal mengirim OTP: ' . $e->getMessage());
    }
    
    // Get new cooldown for next request (akan mengambil nilai cooldown yang sudah diupdate oleh preventOtpSpam)
    $newCooldown = SecurityManager::getOtpCooldown($email);
    
    logApiRequest('POST', '/api/auth/resend-otp', [
        'email' => $email,
        'user_id' => $user['id']
    ], 'success');
    
    ApiResponse::success([
        'email' => $email,
        'otp_sent' => true,
        'wait_time' => $newCooldown,
        'cooldown_seconds' => $newCooldown
    ], 'Kode OTP baru telah dikirim ke email Anda. Periksa kotak masuk dan folder spam.');
    
} catch (Exception $e) {
    ErrorLogger::logSystemError('auth_resend_otp_failed', $e->getMessage(), ['input' => $input ?? null]);
    logApiRequest('POST', '/api/auth/resend-otp', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal mengirim ulang OTP: ' . $e->getMessage());
}