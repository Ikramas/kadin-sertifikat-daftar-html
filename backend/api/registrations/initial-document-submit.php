<?php
// File: backend/api/registrations/initial-document-submit.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/app.php'; // Muat APP_BASE_URL
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; 

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Require authentication
    $currentUser = JWT::requireAuth();
    
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
    $companyName = $input['companyName'] ?? '';
    $businessEntityType = $input['businessEntityType'] ?? '';
    $companyEmail = $input['companyEmail'] ?? '';
    $companyPhone = $input['companyPhone'] ?? ''; 
    $address = $input['address'] ?? '';
    $postalCode = $input['postalCode'] ?? '';
    $province = $input['province'] ?? '';
    $regencyCity = $input['regencyCity'] ?? '';
    $district = $input['district'] ?? '';
    $village = $input['village'] ?? '';
    $ktaKadinNumber = $input['ktaKadinNumber'] ?? '';
    $ktaDate = $input['ktaDate'] ?? '';
    $leaderName = $input['leaderName'] ?? '';
    $leaderPosition = $input['leaderPosition'] ?? '';
    $leaderNik = $input['leaderNik'] ?? '';
    $leaderNpwp = $input['leaderNpwp'] ?? '';
    $uploadedDocuments = $input['uploadedDocuments'] ?? []; // Associative array: ['document_type' => 'document_id']
    
    // Validate input
    $validator = new Validator();
    $validator
        ->required('companyName', $companyName, 'Nama perusahaan wajib diisi')
        ->minLength('companyName', $companyName, 2, 'Nama perusahaan minimal 2 karakter')
        ->required('businessEntityType', $businessEntityType, 'Bentuk badan usaha wajib dipilih')
        ->required('companyEmail', $companyEmail, 'Email perusahaan wajib diisi')
        ->email('companyEmail', $companyEmail, 'Format email perusahaan tidak valid')
        ->required('companyPhone', $companyPhone, 'Telepon perusahaan wajib diisi') 
        ->phone('companyPhone', $companyPhone, 'Nomor telepon perusahaan tidak valid')
        ->required('address', $address, 'Alamat perusahaan wajib diisi')
        ->minLength('address', $address, 10, 'Alamat minimal 10 karakter')
        ->required('postalCode', $postalCode, 'Kode pos wajib diisi')
        ->numeric('postalCode', $postalCode, 'Kode pos harus berupa angka')
        ->minLength('postalCode', $postalCode, 5, 'Kode pos harus 5 digit')
        ->maxLength('postalCode', $postalCode, 5, 'Kode pos harus 5 digit')
        ->required('province', $province, 'Provinsi wajib dipilih')
        ->required('regencyCity', $regencyCity, 'Kabupaten/Kota wajib dipilih')
        ->required('district', $district, 'Kecamatan wajib dipilih')
        ->required('village', $village, 'Kelurahan wajib dipilih')
        ->required('ktaKadinNumber', $ktaKadinNumber, 'Nomor KTA KADIN wajib diisi')
        ->required('ktaDate', $ktaDate, 'Tanggal KTA wajib diisi')
        ->date('ktaDate', $ktaDate, 'Y-m-d', 'Format tanggal KTA tidak valid (YYYY-MM-DD)') 
        ->required('leaderName', $leaderName, 'Nama pimpinan wajib diisi')
        ->required('leaderPosition', $leaderPosition, 'Jabatan pimpinan wajib diisi')
        ->required('leaderNik', $leaderNik, 'NIK pimpinan wajib diisi')
        ->numeric('leaderNik', $leaderNik, 'NIK harus berupa angka')
        ->minLength('leaderNik', $leaderNik, 16, 'NIK harus 16 digit')
        ->maxLength('leaderNik', $leaderNik, 16, 'NIK harus 16 digit')
        ->required('leaderNpwp', $leaderNpwp, 'NPWP pimpinan wajib diisi')
        ->npwp('leaderNpwp', $leaderNpwp, 'Format NPWP pimpinan tidak valid');
    
    $validator->validate();
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if user already submitted documents
    $stmt = $db->prepare("SELECT status FROM users WHERE id = ?");
    $stmt->execute([$currentUser['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        ApiResponse::unauthorized('Pengguna tidak ditemukan');
    }
    
    // --- PERBAIKAN: Izinkan submit dari status 'pending_verification' jika alur register tidak mengisi semua data awal ---
    // Jika flow register disederhanakan, user akan masuk ke 'pending_document_verification' setelah OTP.
    // Jika user sudah masuk 'pending_admin_approval', berarti dia sudah submit, jadi tidak boleh submit lagi.
    if ($user['status'] !== 'pending_document_verification') { 
        ApiResponse::error('Status akun tidak memungkinkan untuk mengirim dokumen registrasi.', 403); 
    }
    
    // Validate required documents. List the types of documents required.
    // Ini masih hardcoded, pertimbangkan untuk memindahkannya ke konfigurasi atau database jika sering berubah
    $requiredDocs = [
        'kta_kadin_terakhir',
        'nib', 
        'akta_pendirian',
        'npwp_perusahaan',
        'sk_kemenkumham',
        'ktp_pimpinan',
        'npwp_pimpinan',
        'pasfoto_pimpinan'
    ];
    
    $missingDocs = [];
    foreach ($requiredDocs as $type) {
        if (!isset($uploadedDocuments[$type]) || empty($uploadedDocuments[$type])) {
            $missingDocs[] = $type; 
        }
    }
    
    if (!empty($missingDocs)) {
        $missingDocLabels = array_map(function($type) {
            return ucwords(str_replace('_', ' ', $type));
        }, $missingDocs);
        ApiResponse::validation([
            'documents' => 'Dokumen wajib yang belum diunggah: ' . implode(', ', $missingDocLabels) . '.'
        ]);
    }
    
    // Verify uploaded documents exist in database and belong to the user
    $allDocumentIds = array_values($uploadedDocuments);
    if (!empty($allDocumentIds)) {
        $placeholders = str_repeat('?,', count($allDocumentIds) - 1) . '?';
        // --- PERBAIKAN KRITIS: Pastikan dokumen kategori 'initial_registration_temp' ---
        $stmt = $db->prepare("SELECT id FROM documents WHERE id IN ($placeholders) AND user_id = ? AND category = 'initial_registration_temp'"); 
        $stmt->execute(array_merge($allDocumentIds, [$currentUser['user_id']]));
        $existingDocs = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $missingDocIds = array_diff($allDocumentIds, $existingDocs);
        if (!empty($missingDocIds)) {
            ErrorLogger::logSystemError('initial_doc_submit_missing_uploaded_docs', 'Some document IDs provided by frontend were not found or not in temp category for user.', [
                'user_id' => $currentUser['user_id'],
                'provided_ids' => $allDocumentIds,
                'missing_ids_in_db' => $missingDocIds
            ]);
            ApiResponse::error('Beberapa dokumen tidak ditemukan di sistem atau bukan dokumen yang baru diunggah untuk registrasi ini.', 400); 
        }
    } else {
        // Jika tidak ada dokumen yang dikirim sama sekali, dan ada dokumen wajib
        if (!empty($requiredDocs)) {
            ApiResponse::error('Tidak ada dokumen yang diunggah. Mohon unggah dokumen wajib.', 400);
        }
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Update company data
        $stmt = $db->prepare("
            UPDATE companies SET 
                company_name = ?, business_entity_type = ?, company_email = ?, company_phone = ?,
                address = ?, postal_code = ?, province = ?, regency_city = ?, district = ?, village = ?,
                leader_name = ?, leader_position = ?, leader_nik = ?, leader_npwp = ?,
                kta_kadin_number = ?, kta_date = ?, status = 'pending_admin_approval', updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([
            $companyName, $businessEntityType, $companyEmail, $companyPhone,
            $address, $postalCode, $province, $regencyCity, $district, $village,
            $leaderName, $leaderPosition, $leaderNik, $leaderNpwp,
            $ktaKadinNumber, $ktaDate, $currentUser['user_id']
        ]);
        
        // Update user status
        $stmt = $db->prepare("UPDATE users SET status = 'pending_admin_approval', updated_at = NOW() WHERE id = ?");
        $stmt->execute([$currentUser['user_id']]);

        // Update document categories from 'initial_registration_temp' to 'initial_registration'
        // dan set statusnya menjadi 'pending_review' karena sudah disubmit
        foreach ($uploadedDocuments as $type => $documentId) { // $type akan berisi document_type karena frontend mengirim associative array
            $stmt = $db->prepare("
                UPDATE documents SET 
                    document_type = ?, category = 'initial_registration', status = 'pending_review', updated_at = NOW()
                WHERE id = ? AND user_id = ? AND category = 'initial_registration_temp'
            ");
            $stmt->execute([$type, $documentId, $currentUser['user_id']]);
        }
        
        // Create notification for admin
        $stmt = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id, created_at)
            SELECT id, 'Dokumen Registrasi Baru', 
                   CONCAT('Pengguna ', ?, ' (ID: ', ?, ') telah mengirim dokumen registrasi untuk verifikasi. Nama Perusahaan: ', ?),
                   'info', 'document', ?, NOW()
            FROM users WHERE role IN ('admin', 'super_admin')
        ");
        $stmt->execute([$currentUser['name'], $currentUser['user_id'], $companyName, $currentUser['user_id']]); 
        
        // Commit transaction
        $db->commit();
        
        logApiRequest('POST', '/api/registrations/initial-document-submit', [
            'user_id' => $currentUser['user_id'],
            'company_name' => $companyName
        ], ['success' => true]);
        
        ApiResponse::success([
            'status' => 'pending_admin_approval',
            'message' => 'Dokumen registrasi berhasil dikirim dan sedang menunggu verifikasi admin'
        ], 'Dokumen registrasi berhasil dikirim! Kami akan memverifikasi data dan dokumen Anda dalam 1-3 hari kerja. Anda akan mendapat notifikasi melalui email setelah proses verifikasi selesai.');
        
    } catch (Exception $e) {
        $db->rollback();
        ErrorLogger::logSystemError('initial_document_submit_transaction_failed', $e->getMessage(), [
            'user_id' => $currentUser['user_id'],
            'input_data' => $input
        ]);
        throw $e; 
    }
    
} catch (Exception $e) {
    logApiRequest('POST', '/api/registrations/initial-document-submit', $input ?? null, $e->getMessage());
    ErrorLogger::logSystemError('initial_document_submit_api_error', $e->getMessage(), [
        'input_data' => $input ?? null
    ]);
    ApiResponse::serverError('Gagal mengirim dokumen registrasi: ' . $e->getMessage());
}