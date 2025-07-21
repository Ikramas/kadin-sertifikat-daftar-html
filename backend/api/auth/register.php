<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/OTPManager.php';

// Fungsi untuk menghasilkan UUID v4 (STANDAR INTERNASIONAL)
// Anda bisa menggantinya dengan library Composer seperti 'ramsey/uuid' jika sudah diinstal.
// Cukup jalankan 'composer require ramsey/uuid' di folder backend.
// Lalu di sini: use Ramsey\Uuid\Uuid; $uuid = Uuid::uuid4()->toString();
if (!function_exists('generateUuidV4')) {
    function generateUuidV4() {
        return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
            mt_rand( 0, 0xffff ),
            mt_rand( 0, 0x0fff ) | 0x4000,
            mt_rand( 0, 0x3fff ) | 0x8000,
            mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
        );
    }
}

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
    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';
    $phone = $input['phone'] ?? '';
    $password = $input['password'] ?? '';
    $confirmPassword = $input['confirmPassword'] ?? '';
    $companyName = $input['companyName'] ?? '';
    $npwp = $input['npwp'] ?? '';
    $nib = $input['nib'] ?? '';
    $address = $input['address'] ?? '';
    $city = $input['city'] ?? '';
    $postalCode = $input['postalCode'] ?? '';
    $companyPhone = $input['companyPhone'] ?? '';
    $companyEmail = $input['companyEmail'] ?? '';
    $businessType = $input['businessType'] ?? '';
    $investmentValue = $input['investmentValue'] ?? '';
    $employeeCount = $input['employeeCount'] ?? '';
    $termsAccepted = $input['termsAccepted'] ?? false;
    
    // Validate input
    $validator = new Validator();
    $validator
        ->required('name', $name, 'Nama lengkap wajib diisi')
        ->minLength('name', $name, 2, 'Nama lengkap minimal 2 karakter')
        ->maxLength('name', $name, 255, 'Nama lengkap maksimal 255 karakter')
        
        ->required('email', $email, 'Email wajib diisi')
        ->email('email', $email, 'Format email tidak valid')
        
        ->required('phone', $phone, 'Nomor telepon wajib diisi')
        ->phone('phone', $phone, 'Nomor telepon tidak valid (8-15 digit)')
        
        ->required('password', $password, 'Password wajib diisi')
        ->password('password', $password, 'Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, dan angka')
        ->match('confirmPassword', $password, $confirmPassword, 'Konfirmasi password tidak cocok')
        
        ->required('companyName', $companyName, 'Nama perusahaan wajib diisi')
        ->minLength('companyName', $companyName, 2, 'Nama perusahaan minimal 2 karakter')
        
        ->required('npwp', $npwp, 'NPWP wajib diisi')
        ->npwp('npwp', $npwp, 'Format NPWP tidak valid (harus 15 digit)')
        
        ->required('nib', $nib, 'NIB wajib diisi')
        ->nib('nib', $nib, 'Format NIB tidak valid (10-13 digit)')
        
        ->required('address', $address, 'Alamat lengkap wajib diisi')
        ->minLength('address', $address, 10, 'Alamat minimal 10 karakter')
        
        ->required('city', $city, 'Kota wajib diisi')
        
        ->required('postalCode', $postalCode, 'Kode pos wajib diisi')
        ->numeric('postalCode', $postalCode, 'Kode pos harus berupa angka')
        ->minLength('postalCode', $postalCode, 5, 'Kode pos harus 5 digit')
        ->maxLength('postalCode', $postalCode, 5, 'Kode pos harus 5 digit')
        
        ->required('companyPhone', $companyPhone, 'Telepon perusahaan wajib diisi')
        ->phone('companyPhone', $companyPhone, 'Nomor telepon perusahaan tidak valid')
        
        ->required('companyEmail', $companyEmail, 'Email perusahaan wajib diisi')
        ->email('companyEmail', $companyEmail, 'Format email perusahaan tidak valid')
        
        ->required('businessType', $businessType, 'Jenis usaha wajib diisi')
        
        ->required('investmentValue', $investmentValue, 'Modal investasi wajib diisi')
        ->numeric('investmentValue', $investmentValue, 'Modal investasi harus berupa angka')
        
        ->required('employeeCount', $employeeCount, 'Jumlah karyawan wajib diisi')
        ->numeric('employeeCount', $employeeCount, 'Jumlah karyawan harus berupa angka')
        
        ->custom('termsAccepted', $termsAccepted, function($value) {
            return $value === true;
        }, 'Anda harus menyetujui syarat dan ketentuan');
    
    $validator->validate();
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if email already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        ApiResponse::error('Email sudah terdaftar. Silakan gunakan email lain atau login jika Anda sudah memiliki akun.');
    }
    
    // Check if phone already exists (opsional, tergantung kebijakan Anda)
    $stmt = $db->prepare("SELECT id FROM users WHERE phone = ?");
    $stmt->execute([$phone]);
    if ($stmt->fetch()) {
        ApiResponse::error('Nomor telepon sudah terdaftar. Silakan gunakan nomor lain.');
    }
    
    // Check if NPWP already exists (opsional, tergantung kebijakan Anda)
    $stmt = $db->prepare("SELECT id FROM companies WHERE npwp = ?");
    $stmt->execute([$npwp]);
    if ($stmt->fetch()) {
        ApiResponse::error('NPWP sudah terdaftar. Silakan periksa kembali atau hubungi administrator.');
    }
    
    // Check if NIB already exists (opsional, tergantung kebijakan Anda)
    $stmt = $db->prepare("SELECT id FROM companies WHERE nib = ?");
    $stmt->execute([$nib]);
    if ($stmt->fetch()) {
        ApiResponse::error('NIB sudah terdaftar. Silakan periksa kembali atau hubungi administrator.');
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Hash password
        $hashedPassword = SecurityManager::hashPassword($password);
        
        $uuid = generateUuidV4(); // Hasilkan UUID v4 baru
        
        // Insert user dengan UUID
        $stmt = $db->prepare("
            INSERT INTO users (uuid, name, email, phone, password, status, created_at) 
            VALUES (?, ?, ?, ?, ?, 'pending_verification', NOW())
        ");
        $stmt->execute([$uuid, $name, $email, $phone, $hashedPassword]);
        $userId = $db->lastInsertId();
        
        // Insert company
        $stmt = $db->prepare("
            INSERT INTO companies (
                user_id, company_name, npwp, nib, address, city, postal_code,
                company_phone, company_email, business_type, investment_value, employee_count,
                business_entity_type, leader_name, leader_position, leader_nik, leader_npwp,
                kta_kadin_number, kta_date, province, regency_city, district, village,
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PT', '', '', '', '', '', CURDATE(), '', '', '', '', 'pending', NOW())
        ");
        $stmt->execute([
            $userId, $companyName, $npwp, $nib, $address, $city, $postalCode,
            $companyPhone, $companyEmail, $businessType, $investmentValue, $employeeCount
        ]);
        
        // Generate and send OTP
        $otpManager = new OTPManager($db);
        $otp = $otpManager->generateOTP($email);
        $otpManager->sendOTP($email, $otp, $name);
        
        // Commit transaction
        $db->commit();
        
        logApiRequest('POST', '/api/auth/register', [
            'email' => $email,
            'name' => $name,
            'uuid' => $uuid // Log UUID
        ], ['success' => true, 'user_id' => $userId]);
        
        ApiResponse::success([
            'user_id' => $userId,
            'uuid' => $uuid, // Tambahkan UUID ke respons API
            'email' => $email,
            'otp_sent' => true
        ], 'Pendaftaran berhasil! Silakan periksa email Anda untuk kode verifikasi OTP.');
        
    } catch (Exception $e) {
        $db->rollback();
        logApiRequest('POST', '/api/auth/register', $input ?? null, $e->getMessage());
        ApiResponse::serverError('Gagal melakukan pendaftaran: ' . $e->getMessage());
    }
} catch (Exception $e) {
    logApiRequest('POST', '/api/auth/register', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal melakukan pendaftaran: ' . $e->getMessage());
}