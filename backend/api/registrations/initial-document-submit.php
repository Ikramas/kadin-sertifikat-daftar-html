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
    // Require authentication
    $currentUser = JWT::requireAuth();
    
    // Validate CSRF token
    CSRFProtection::requireValidToken();
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid');
    }
    
    // Sanitize input
    $input = SecurityManager::sanitizeInput($input);
    
    // Extract data
    $companyName = $input['companyName'] ?? '';
    $businessEntityType = $input['businessEntityType'] ?? '';
    $companyEmail = $input['companyEmail'] ?? '';
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
    $uploadedDocuments = $input['uploadedDocuments'] ?? [];
    
    // Validate input
    $validator = new Validator();
    $validator
        ->required('companyName', $companyName, 'Nama perusahaan wajib diisi')
        ->required('businessEntityType', $businessEntityType, 'Bentuk badan usaha wajib dipilih')
        ->required('companyEmail', $companyEmail, 'Email perusahaan wajib diisi')
        ->email('companyEmail', $companyEmail, 'Format email perusahaan tidak valid')
        ->required('address', $address, 'Alamat perusahaan wajib diisi')
        ->required('postalCode', $postalCode, 'Kode pos wajib diisi')
        ->numeric('postalCode', $postalCode, 'Kode pos harus berupa angka')
        ->required('province', $province, 'Provinsi wajib dipilih')
        ->required('regencyCity', $regencyCity, 'Kabupaten/Kota wajib dipilih')
        ->required('district', $district, 'Kecamatan wajib dipilih')
        ->required('village', $village, 'Kelurahan wajib dipilih')
        ->required('ktaKadinNumber', $ktaKadinNumber, 'Nomor KTA KADIN wajib diisi')
        ->required('ktaDate', $ktaDate, 'Tanggal KTA wajib diisi')
        ->required('leaderName', $leaderName, 'Nama pimpinan wajib diisi')
        ->required('leaderPosition', $leaderPosition, 'Jabatan pimpinan wajib diisi')
        ->required('leaderNik', $leaderNik, 'NIK pimpinan wajib diisi')
        ->numeric('leaderNik', $leaderNik, 'NIK harus berupa angka')
        ->required('leaderNpwp', $leaderNpwp, 'NPWP pimpinan wajib diisi')
        ->npwp('leaderNpwp', $leaderNpwp, 'Format NPWP pimpinan tidak valid');
    
    $validator->validate();
    
    // Validate date format
    $ktaDateObj = DateTime::createFromFormat('Y-m-d', $ktaDate);
    if (!$ktaDateObj) {
        ApiResponse::error('Format tanggal KTA tidak valid');
    }
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if user already submitted documents
    $stmt = $db->prepare("SELECT status FROM users WHERE id = ?");
    $stmt->execute([$currentUser['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        ApiResponse::unauthorized('Pengguna tidak ditemukan');
    }
    
    if (!in_array($user['status'], ['pending_document_verification', 'pending_admin_approval'])) {
        ApiResponse::error('Status akun tidak memungkinkan untuk mengirim dokumen registrasi');
    }
    
    // Validate required documents
    $requiredDocs = [
        'kta_kadin_terakhir' => 'KTA Kadin Terakhir',
        'nib' => 'NIB',
        'akta_pendirian' => 'Akta Pendirian',
        'npwp_perusahaan' => 'NPWP Perusahaan',
        'sk_kemenkumham' => 'SK Kemenkumham',
        'ktp_pimpinan' => 'KTP Pimpinan',
        'npwp_pimpinan' => 'NPWP Pimpinan',
        'pasfoto_pimpinan' => 'Pasfoto Pimpinan'
    ];
    
    $missingDocs = [];
    foreach ($requiredDocs as $type => $name) {
        if (!isset($uploadedDocuments[$type]) || empty($uploadedDocuments[$type])) {
            $missingDocs[] = $name;
        }
    }
    
    if (!empty($missingDocs)) {
        ApiResponse::validation([
            'documents' => 'Dokumen wajib yang belum diunggah: ' . implode(', ', $missingDocs)
        ]);
    }
    
    // Verify uploaded documents exist in database
    $allDocumentIds = array_values($uploadedDocuments);
    if (!empty($allDocumentIds)) {
        $placeholders = str_repeat('?,', count($allDocumentIds) - 1) . '?';
        $stmt = $db->prepare("SELECT id FROM documents WHERE id IN ($placeholders) AND user_id = ?");
        $stmt->execute(array_merge($allDocumentIds, [$currentUser['user_id']]));
        $existingDocs = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $missingDocIds = array_diff($allDocumentIds, $existingDocs);
        if (!empty($missingDocIds)) {
            ApiResponse::error('Beberapa dokumen tidak ditemukan atau bukan milik Anda');
        }
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Update company data
        $stmt = $db->prepare("
            UPDATE companies SET 
                company_name = ?, business_entity_type = ?, company_email = ?,
                address = ?, postal_code = ?, province = ?, regency_city = ?, district = ?, village = ?,
                leader_name = ?, leader_position = ?, leader_nik = ?, leader_npwp = ?,
                kta_kadin_number = ?, kta_date = ?, status = 'pending', updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([
            $companyName, $businessEntityType, $companyEmail,
            $address, $postalCode, $province, $regencyCity, $district, $village,
            $leaderName, $leaderPosition, $leaderNik, $leaderNpwp,
            $ktaKadinNumber, $ktaDate, $currentUser['user_id']
        ]);
        
        // Update user status
        $stmt = $db->prepare("UPDATE users SET status = 'pending_admin_approval', updated_at = NOW() WHERE id = ?");
        $stmt->execute([$currentUser['user_id']]);
        
        // Update document categories
        foreach ($uploadedDocuments as $type => $documentId) {
            $stmt = $db->prepare("
                UPDATE documents SET 
                    document_type = ?, category = 'initial_registration', status = 'uploaded'
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$type, $documentId, $currentUser['user_id']]);
        }
        
        // Create notification for admin
        $stmt = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id, created_at)
            SELECT id, 'Dokumen Registrasi Baru', 
                   CONCAT('Pengguna ', ?, ' telah mengirim dokumen registrasi untuk verifikasi'),
                   'info', 'document', ?, NOW()
            FROM users WHERE role IN ('admin', 'super_admin')
        ");
        $stmt->execute([$currentUser['user_id'], $currentUser['user_id']]);
        
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
        throw $e;
    }
    
} catch (Exception $e) {
    logApiRequest('POST', '/api/registrations/initial-document-submit', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal mengirim dokumen registrasi: ' . $e->getMessage());
}