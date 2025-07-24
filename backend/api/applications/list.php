<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Memastikan pengguna terautentikasi 
    $currentUser = JWT::requireAuth(); 
    
    // Koneksi ke database
    $database = new Database(); 
    $db = $database->getConnection(); 
    
    // Ambil aplikasi dengan info perusahaan dan detail aplikasi baru
    // PERBAIKAN: Tambahkan kolom `code_reg` ke SELECT statement
    $stmt = $db->prepare("
        SELECT 
            a.id, 
            a.application_number, 
            a.code_reg, -- <--- TAMBAHKAN BARIS INI
            a.application_type, 
            a.current_sbu_number,
            a.requested_classification, 
            a.business_field, 
            a.company_qualification,
            a.status, 
            a.submission_date, 
            a.review_date, 
            a.completion_date,
            a.notes, 
            a.created_at, 
            a.updated_at,
            c.company_name,
            u.name as reviewer_name,
            a.akta_pendirian_notaris,
            a.akta_pendirian_nomor,
            a.akta_pendirian_tanggal,
            a.akta_perubahan_notaris,
            a.akta_perubahan_nomor,
            a.akta_perubahan_tanggal,
            a.sk_kemenkumham_nomor_tanggal,
            a.nib_date,
            a.sub_bidang_code,
            a.bidang_name,
            a.npwp_perusahaan, 
            a.npwp_pimpinan,   
            a.nib_perusahaan   
        FROM applications a
        LEFT JOIN companies c ON a.company_id = c.id
        LEFT JOIN users u ON a.reviewer_id = u.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
    ");
    $stmt->execute([$currentUser['user_id']]);
    $applications = $stmt->fetchAll(PDO::FETCH_ASSOC); 
    
    // Dapatkan jumlah dokumen untuk setiap aplikasi dan format tanggal
    foreach ($applications as &$application) {
        // Query dokumen harus sesuai dengan cara Anda mengaitkan dokumen SBU
        // Asumsi: dokumen SBU memiliki category='sbu_application' dan related_application_id
        $stmt_doc_count = $db->prepare("
            SELECT COUNT(*) as document_count
            FROM documents 
            WHERE user_id = ? AND category = 'sbu_application' AND related_application_id = ?
        ");
        $stmt_doc_count->execute([$currentUser['user_id'], $application['id']]);
        $docCount = $stmt_doc_count->fetch();
        $application['document_count'] = $docCount['document_count'] ?? 0;
        
        // Format tanggal untuk kolom yang sudah ada
        $application['created_at_formatted'] = $application['created_at'] ? date('d/m/Y H:i', strtotime($application['created_at'])) : null;
        $application['submission_date_formatted'] = $application['submission_date'] ? date('d/m/Y H:i', strtotime($application['submission_date'])) : null;
        $application['review_date_formatted'] = $application['review_date'] ? date('d/m/Y H:i', strtotime($application['review_date'])) : null;
        $application['completion_date_formatted'] = $application['completion_date'] ? date('d/m/Y H:i', strtotime($application['completion_date'])) : null;

        // Format tanggal untuk bidang baru (jika ada dan perlu diformat)
        $application['akta_pendirian_tanggal_formatted'] = $application['akta_pendirian_tanggal'] ? date('d/m/Y', strtotime($application['akta_pendirian_tanggal'])) : null;
        $application['akta_perubahan_tanggal_formatted'] = $application['akta_perubahan_tanggal'] ? date('d/m/Y', strtotime($application['akta_perubahan_tanggal'])) : null;
        $application['nib_date_formatted'] = $application['nib_date'] ? date('d/m/Y', strtotime($application['nib_date'])) : null;
    }
    
    logApiRequest('GET', '/api/applications/list', ['user_id' => $currentUser['user_id']], ['success' => true, 'count' => count($applications)]);
    
    ApiResponse::success([
        'applications' => $applications,
        'total' => count($applications)
    ], 'Daftar permohonan berhasil dimuat');
    
} catch (Exception $e) {
    logApiRequest('GET', '/api/applications/list', ['user_id' => $currentUser['user_id'] ?? null], $e->getMessage());
    ApiResponse::serverError('Gagal memuat daftar permohonan: ' . $e->getMessage());
}