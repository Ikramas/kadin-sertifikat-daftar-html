<?php
// File: backend/api/users/profile.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; // Pastikan ErrorLogger dimuat

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Require authentication
    $currentUser = JWT::requireAuth(); 
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Get user profile with company data
    $stmt = $db->prepare("
        SELECT 
            u.id, u.uuid, u.name, u.email, u.phone, u.status, u.role, u.email_verified_at,
            u.created_at, u.updated_at,
            c.id as company_id, c.company_name, c.business_entity_type, c.npwp, c.nib,
            c.address, c.city, c.postal_code, c.province, c.regency_city, c.district, c.village,
            c.company_phone, c.company_email, c.business_type, c.investment_value, c.employee_count,
            c.leader_name, c.leader_position, c.leader_nik, c.leader_npwp,
            c.kta_kadin_number, c.kta_date, c.status as company_status,
            c.verified_at as company_verified_at
        FROM users u
        LEFT JOIN companies c ON u.id = c.user_id
        WHERE u.id = ?
    ");
    $stmt->execute([$currentUser['user_id']]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC); // Fetch as associative array
    
    if (!$profile) {
        ApiResponse::notFound('Profil pengguna tidak ditemukan');
    }
    
    // Prepare response data
    $userData = [
        'id' => $profile['id'],
        'uuid' => $profile['uuid'],
        'name' => $profile['name'],
        'email' => $profile['email'],
        'phone' => $profile['phone'],
        'status' => $profile['status'],
        'role' => $profile['role'],
        'email_verified_at' => $profile['email_verified_at'],
        'created_at' => $profile['created_at'],
        'updated_at' => $profile['updated_at']
    ];
    
    $companyData = null;
    if ($profile['company_id']) { // Pastikan ada company_id sebelum mengisi data perusahaan
        $companyData = [
            'id' => $profile['company_id'],
            'company_name' => $profile['company_name'],
            'business_entity_type' => $profile['business_entity_type'],
            'npwp' => $profile['npwp'],
            'nib' => $profile['nib'],
            'address' => $profile['address'],
            'city' => $profile['city'],
            'postal_code' => $profile['postal_code'],
            'province' => $profile['province'],
            'regency_city' => $profile['regency_city'],
            'district' => $profile['district'],
            'village' => $profile['village'],
            'company_phone' => $profile['company_phone'],
            'company_email' => $profile['company_email'],
            'business_type' => $profile['business_type'],
            'investment_value' => $profile['investment_value'],
            'employee_count' => $profile['employee_count'],
            'leader_name' => $profile['leader_name'],
            'leader_position' => $profile['leader_position'],
            'leader_nik' => $profile['leader_nik'],
            'leader_npwp' => $profile['leader_npwp'],
            'kta_kadin_number' => $profile['kta_kadin_number'],
            'kta_date' => $profile['kta_date'],
            'status' => $profile['company_status'],
            'verified_at' => $profile['company_verified_at']
        ];
    }
    
    // Ambil dokumen terkait pengguna yang terautentikasi
    $userDocuments = [];
    $stmt_docs = $db->prepare("SELECT id, original_name, file_name, document_type, status FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC");
    $stmt_docs->execute([$currentUser['user_id']]);
    $docs_raw = $stmt_docs->fetchAll(PDO::FETCH_ASSOC);

    foreach ($docs_raw as $doc) {
        if (empty($doc['file_name'])) {
            ErrorLogger::logSystemError('profile_document_missing_filename', "Document ID " . $doc['id'] . " has empty file_name in DB. Cannot generate correct download URL for user_id " . $currentUser['user_id']);
            $doc['file_url'] = null; // Set null agar tombol unduh tidak aktif jika file_name kosong
        } else {
            // Menggunakan file_name di URL download, yang lebih aman sudah divalidasi
            $doc['file_url'] = '/backend/api/documents/download.php?file_name=' . urlencode($doc['file_name']); 
        }
        $userDocuments[] = $doc;
    }

    logApiRequest('GET', '/api/users/profile', ['user_id' => $currentUser['user_id']], ['success' => true]);
    
    ApiResponse::success([
        'user' => $userData,
        'company' => $companyData,
        'documents' => $userDocuments
    ], 'Profil berhasil dimuat');
    
} catch (Exception $e) {
    ErrorLogger::logSystemError('user_profile_fetch_failed', $e->getMessage(), ['user_id' => $currentUser['user_id'] ?? null]);
    logApiRequest('GET', '/api/users/profile', ['user_id' => $currentUser['user_id'] ?? null], $e->getMessage());
    ApiResponse::serverError('Gagal memuat profil: ' . $e->getMessage());
}