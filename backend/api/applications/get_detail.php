<?php
// File: backend/api/applications/get_detail.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/app.php'; // Muat APP_BASE_URL
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; 

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Memastikan pengguna terautentikasi
    $currentUser = JWT::requireAuth();

    // Dapatkan code_reg dari query parameter (opsi utama) atau segmen URL (jika router digunakan)
    $codeReg = $_GET['code_reg'] ?? null; 
    // Jika menggunakan router: $codeReg = $routeSegments[2] ?? null;

    if (!$codeReg) {
        ApiResponse::error('Kode registrasi permohonan tidak disediakan', 400);
    }

    // Koneksi ke database
    $database = new Database();
    $db = $database->getConnection();

    // Ambil detail aplikasi beserta info perusahaan dan reviewer
    $stmt = $db->prepare("
        SELECT
            a.id,
            a.application_number,
            a.code_reg, 
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
            a.npwp_perusahaan, -- Ambil dari data aplikasi (historis)
            a.npwp_pimpinan,   -- Ambil dari data aplikasi (historis)
            a.nib_perusahaan,  -- Ambil dari data aplikasi (historis)
            c.company_name,
            c.npwp as company_npwp_master, -- Ambil dari master company data (terkini)
            c.nib as company_nib_master,   -- Ambil dari master company data (terkini)
            c.leader_npwp as company_leader_npwp_master, -- Ambil dari master company data (terkini)
            u_reviewer.name as reviewer_name
        FROM applications a
        LEFT JOIN companies c ON a.user_id = c.user_id -- JOIN ke company berdasarkan user_id
        LEFT JOIN users u_reviewer ON a.reviewer_id = u_reviewer.id
        WHERE a.code_reg = ? AND a.user_id = ? 
    ");
    $stmt->execute([$codeReg, $currentUser['user_id']]);
    $application = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$application) {
        ApiResponse::notFound('Permohonan tidak ditemukan atau Anda tidak memiliki akses.');
    }

    // Ambil dokumen terkait permohonan ini
    $stmt_docs = $db->prepare("
        SELECT id, original_name, file_name, document_type, status
        FROM documents
        WHERE related_application_id = ? AND user_id = ? AND category = 'sbu_application'
        ORDER BY uploaded_at DESC
    ");
    $stmt_docs->execute([$application['id'], $currentUser['user_id']]); 
    $documents = $stmt_docs->fetchAll(PDO::FETCH_ASSOC);

    // Format data dokumen untuk URL unduhan
    foreach ($documents as &$doc) {
        if (empty($doc['file_name'])) {
            $doc['file_url'] = null;
            ErrorLogger::logSystemError('application_detail_doc_missing_filename', "Document ID {$doc['id']} has empty file_name in DB for user {$currentUser['user_id']} and application {$application['id']}.");
        } else {
            // Menggunakan file_name di URL download
            $doc['file_url'] = '/backend/api/documents/download.php?file_name=' . urlencode($doc['file_name']); 
        }
    }

    // Format tanggal
    // Pastikan format tanggal konsisten dengan yang diharapkan frontend (d M Y H:i atau d M Y)
    $application['created_at_formatted'] = $application['created_at'] ? date('d M Y H:i', strtotime($application['created_at'])) : null;
    $application['submission_date_formatted'] = $application['submission_date'] ? date('d M Y H:i', strtotime($application['submission_date'])) : null;
    $application['review_date_formatted'] = $application['review_date'] ? date('d M Y H:i', strtotime($application['review_date'])) : null;
    $application['completion_date_formatted'] = $application['completion_date'] ? date('d M Y H:i', strtotime($application['completion_date'])) : null;
    $application['akta_pendirian_tanggal_formatted'] = $application['akta_pendirian_tanggal'] ? date('d M Y', strtotime($application['akta_pendirian_tanggal'])) : null;
    $application['akta_perubahan_tanggal_formatted'] = $application['akta_perubahan_tanggal'] ? date('d M Y', strtotime($application['akta_perubahan_tanggal'])) : null;
    $application['nib_date_formatted'] = $application['nib_date'] ? date('d M Y', strtotime($application['nib_date'])) : null;
    
    // Gunakan application_number asli untuk application_number_formatted
    $application['application_number_formatted'] = $application['application_number'];


    logApiRequest('GET', '/api/applications/get_detail', ['user_id' => $currentUser['user_id'], 'code_reg' => $codeReg], 'success');

    ApiResponse::success([
        'application' => $application,
        'documents' => $documents
    ], 'Detail permohonan berhasil dimuat.');

} catch (Exception $e) {
    ErrorLogger::logSystemError('application_detail_fetch', $e->getMessage(), ['user_id' => $currentUser['user_id'] ?? null, 'code_reg' => $codeReg ?? null]);
    logApiRequest('GET', '/api/applications/get_detail', ['user_id' => $currentUser['user_id'] ?? null, 'code_reg' => $codeReg ?? null], $e->getMessage());
    ApiResponse::serverError('Gagal memuat detail permohonan: ' . $e->getMessage());
}