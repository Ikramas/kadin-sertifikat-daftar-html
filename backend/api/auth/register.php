<?php
// File: backend/api/auth/register.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/app.php'; // Muat konfigurasi aplikasi
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/OTPManager.php';
require_once '../../classes/ErrorLogger.php'; 
require_once '../../classes/Utils.php'; // Muat kelas Utils

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
    
    // Prevent brute force using IP address
    SecurityManager::preventBruteForce($_SERVER['REMOTE_ADDR'], 'register_attempt', 5, 300); 

    // Extract data
    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';
    $phone = $input['phone'] ?? '';
    $password = $input['password'] ?? '';
    $confirmPassword = $input['confirmPassword'] ?? '';
    
    // Data Perusahaan - Pastikan semua diambil dari input
    $companyName = $input['companyName'] ?? '';
    $npwp = $input['npwp'] ?? ''; // NPWP akan diformat dari frontend
    $nib = $input['nib'] ?? '';
    $address = $input['address'] ?? '';
    $city = $input['city'] ?? '';
    $postalCode = $input['postalCode'] ?? '';
    $companyPhone = $input['companyPhone'] ?? '';
    $companyEmail = $input['companyEmail'] ?? '';
    $businessType = $input['businessType'] ?? '';
    $investmentValue = $input['investmentValue'] ?? '';
    $employeeCount = $input['employeeCount'] ?? ''; // Sekarang bisa string dengan huruf & angka
    $termsAccepted = $input['termsAccepted'] ?? false;
    
    // Field-field yang tidak dikumpulkan di form register awal, akan diset default
    $businessEntityType = $input['businessEntityType'] ?? ''; // Dihapus default 'PT' agar validasi min(1) berjalan
    $province = $input['province'] ?? ''; 
    $regencyCity = $input['regencyCity'] ?? '';
    $district = $input['district'] ?? '';
    $village = $input['village'] ?? '';
    $leaderName = $input['leaderName'] ?? '';
    $leaderPosition = $input['leaderPosition'] ?? '';
    $leaderNik = $input['leaderNik'] ?? ''; 
    $leaderNpwp = $input['leaderNpwp'] ?? ''; 
    $ktaKadinNumber = $input['ktaKadinNumber'] ?? '';
    $ktaDate = $input['ktaDate'] ?? ''; 

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
        ->password('password', $password, 'Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, dan simbol') 
        ->match('confirmPassword', $password, $confirmPassword, 'Konfirmasi password tidak cocok')
        
        ->required('companyName', $companyName, 'Nama perusahaan wajib diisi')
        ->minLength('companyName', $companyName, 2, 'Nama perusahaan minimal 2 karakter')
        
        ->required('npwp', $npwp, 'NPWP wajib diisi')
        ->npwp('npwp', $npwp, 'Format NPWP tidak valid (harus 15 digit angka)') 
        
        ->required('nib', $nib, 'NIB wajib diisi')
        ->nib('nib', $nib, 'Format NIB tidak valid (harus 13 digit angka)') 
        
        // Hapus 'required' untuk bidang-bidang yang tidak wajib dari frontend
        // ->required('address', $address, 'Alamat lengkap wajib diisi')
        // ->minLength('address', $address, 10, 'Alamat minimal 10 karakter')
        
        // ->required('city', $city, 'Kota wajib diisi')
        
        // ->required('postalCode', $postalCode, 'Kode pos wajib diisi')
        ->numeric('postalCode', $postalCode, 'Kode pos harus berupa angka')
        ->minLength('postalCode', $postalCode, 5, 'Kode pos harus 5 digit')
        ->maxLength('postalCode', $postalCode, 5, 'Kode pos harus 5 digit')
        
        // ->required('companyPhone', $companyPhone, 'Telepon perusahaan wajib diisi')
        ->phone('companyPhone', $companyPhone, 'Nomor telepon perusahaan tidak valid')
        
        // ->required('companyEmail', $companyEmail, 'Email perusahaan wajib diisi')
        ->email('companyEmail', $companyEmail, 'Format email perusahaan tidak valid')
        
        ->required('businessType', $businessType, 'Jenis usaha wajib dipilih') // Tetap wajib karena ada di frontend
        
        // ->required('investmentValue', $investmentValue, 'Modal investasi wajib diisi')
        ->numeric('investmentValue', $investmentValue, 'Modal investasi harus berupa angka')
        
        ->required('employeeCount', $employeeCount, 'Jumlah karyawan wajib diisi') // Tetap wajib karena ada di frontend
        
        ->required('businessEntityType', $businessEntityType, 'Bentuk badan usaha wajib dipilih') // Tetap wajib karena ada di frontend
        
        // Hapus 'required' untuk bidang-bidang yang tidak wajib dari frontend
        // ->required('province', $province, 'Provinsi wajib diisi')
        // ->required('regencyCity', $regencyCity, 'Kabupaten/Kota wajib diisi')
        // ->required('district', $district, 'Kecamatan wajib diisi')
        // ->required('village', $village, 'Kelurahan wajib diisi')
        // ->required('leaderName', $leaderName, 'Nama pimpinan wajib diisi')
        // ->required('leaderPosition', $leaderPosition, 'Jabatan pimpinan wajib diisi')
        // ->required('leaderNik', $leaderNik, 'NIK pimpinan wajib diisi')
        ->numeric('leaderNik', $leaderNik, 'NIK harus berupa angka')
        ->minLength('leaderNik', $leaderNik, 16, 'NIK harus 16 digit')
        ->maxLength('leaderNik', $leaderNik, 16, 'NIK harus 16 digit')
        // ->required('leaderNpwp', $leaderNpwp, 'NPWP pimpinan wajib diisi')
        ->npwp('leaderNpwp', $leaderNpwp, 'Format NPWP pimpinan tidak valid')
        // ->required('ktaKadinNumber', $ktaKadinNumber, 'Nomor KTA KADIN wajib diisi')
        // ->required('ktaDate', $ktaDate, 'Tanggal KTA wajib diisi')
        ->date('ktaDate', $ktaDate, 'Y-m-d', 'Format tanggal KTA tidak valid (YYYY-MM-DD)')
        
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
        ApiResponse::error('Email sudah terdaftar. Silakan gunakan email lain atau login jika Anda sudah memiliki akun.', 409); 
    }
    
    // Check if phone already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE phone = ?");
    $stmt->execute([$phone]);
    if ($stmt->fetch()) {
        ApiResponse::error('Nomor telepon sudah terdaftar. Silakan gunakan nomor lain.', 409); 
    }
    
    // Check if NPWP already exists
    $stmt = $db->prepare("SELECT id FROM companies WHERE npwp = ?");
    // --- PERBAIKAN: Gunakan NPWP yang diterima dari frontend (sudah diformat) untuk cek duplikasi
    $stmt->execute([$npwp]); 
    if ($stmt->fetch()) {
        ApiResponse::error('NPWP sudah terdaftar. Silakan periksa kembali atau hubungi administrator.', 409); 
    }
    
    // Check if NIB already exists
    $stmt = $db->prepare("SELECT id FROM companies WHERE nib = ?");
    $stmt->execute([$nib]);
    if ($stmt->fetch()) {
        ApiResponse::error('NIB sudah terdaftar. Silakan periksa kembali atau hubungi administrator.', 409); 
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Hash password
        $hashedPassword = SecurityManager::hashPassword($password);
        
        $uuid = Utils::generateUuidV4(); // Gunakan Utils untuk UUID
        
        // Insert user
        $stmt = $db->prepare("
            INSERT INTO users (uuid, name, email, phone, password, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, 'pending_verification', NOW(), NOW())
        ");
        $stmt->execute([$uuid, $name, $email, $phone, $hashedPassword]);
        $userId = $db->lastInsertId();
        
        // Insert company dengan semua data yang dikumpulkan dari form registrasi (termasuk default jika tidak dikirim)
        $stmt = $db->prepare("
            INSERT INTO companies (
                user_id, company_name, npwp, nib, address, city, postal_code,
                company_phone, company_email, business_type, investment_value, employee_count,
                business_entity_type, leader_name, leader_position, leader_nik, leader_npwp,
                kta_kadin_number, kta_date, province, regency_city, district, village,
                status, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                'pending_document_verification', NOW(), NOW()
            )
        ");
        $stmt->execute([
            $userId, $companyName, $npwp, $nib, $address, $city, $postalCode,
            $companyPhone, $companyEmail, $businessType, $investmentValue, $employeeCount, // employeeCount akan disimpan apa adanya
            $businessEntityType, $leaderName, $leaderPosition, $leaderNik, $leaderNpwp,
            $ktaKadinNumber, $ktaDate, $province, $regencyCity, $district, $village
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
            'user_id' => $userId, 
            'uuid' => $uuid 
        ], 'success');
        
        ApiResponse::success([
            'user_id' => $userId,
            'uuid' => $uuid, 
            'email' => $email,
            'otp_sent' => true,
            'csrf_token' => CSRFProtection::generateToken() 
        ], 'Pendaftaran berhasil! Silakan periksa email Anda untuk kode verifikasi OTP.');
        
    } catch (Exception $e) {
        $db->rollback();
        ErrorLogger::logSystemError('auth_register_failed', $e->getMessage(), ['input' => $input ?? null]);
        logApiRequest('POST', '/api/auth/register', $input ?? null, $e->getMessage());
        ApiResponse::serverError('Gagal melakukan pendaftaran: ' . $e->getMessage());
    }
} catch (Exception $e) {
    ErrorLogger::logSystemError('auth_register_validation_failed', $e->getMessage(), ['input' => $input ?? null]);
    logApiRequest('POST', '/api/auth/register', $input ?? null, $e->getMessage());
    // Tangkap validasi error dari Validator::validate()
    if ($e->getMessage() === 'Data tidak valid') {
        // ApiResponse::validation sudah dipanggil di Validator::validate()
        // jadi kita tidak perlu memanggilnya lagi di sini.
    } else {
        ApiResponse::serverError('Gagal melakukan pendaftaran: ' . $e->getMessage());
    }
}
