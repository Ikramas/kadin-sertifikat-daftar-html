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

    // Dapatkan code_reg dari query parameter
    $codeReg = $_GET['code_reg'] ?? null; // <-- Mengambil code_reg dari URL

    if (!$codeReg) {
        ApiResponse::error('Kode registrasi permohonan tidak disediakan', 400);
    }

    // Koneksi ke database
    $database = new Database();
    $db = $database->getConnection();

    // Ambil detail aplikasi beserta info perusahaan dan reviewer
    // PENTING: WHERE a.code_reg = ? AND a.user_id = ?
    // Ini memastikan bahwa hanya pemilik permohonan yang dapat melihat detailnya.
    $stmt = $db->prepare("
        SELECT
            a.id,
            a.application_number,
            a.code_reg, -- <-- Pastikan code_reg diambil
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
            a.npwp_perusahaan,
            a.npwp_pimpinan,
            a.nib_perusahaan,
            c.company_name,
            c.npwp,
            c.nib,
            c.leader_npwp,
            u_reviewer.name as reviewer_name
        FROM applications a
        LEFT JOIN companies c ON a.company_id = c.id
        LEFT JOIN users u_reviewer ON a.reviewer_id = u_reviewer.id
        WHERE a.code_reg = ? AND a.user_id = ? -- <-- Filter berdasarkan code_reg DAN user_id
    ");
    $stmt->execute([$codeReg, $currentUser['user_id']]);
    $application = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$application) {
        // Jika tidak ditemukan atau user tidak memiliki akses
        ApiResponse::notFound('Permohonan tidak ditemukan atau Anda tidak memiliki akses.');
    }

    // Ambil dokumen terkait permohonan ini
    $stmt_docs = $db->prepare("
        SELECT id, original_name, file_name, document_type, status
        FROM documents
        WHERE related_application_id = ? AND user_id = ?
        ORDER BY uploaded_at DESC
    ");
    // Gunakan application['id'] yang didapatkan dari query utama karena dokumen masih terkait dengan ID internal
    $stmt_docs->execute([$application['id'], $currentUser['user_id']]); 
    $documents = $stmt_docs->fetchAll(PDO::FETCH_ASSOC);

    // Format data dokumen untuk URL unduhan
    foreach ($documents as &$doc) {
        if (empty($doc['file_name'])) {
            $doc['file_url'] = null;
        } else {
            $doc['file_url'] = '/backend/api/documents/download.php?file_name=' . urlencode($doc['file_name']);
        }
    }

    // Format tanggal
    $application['created_at_formatted'] = $application['created_at'] ? date('d M Y H:i', strtotime($application['created_at'])) : null;
    $application['submission_date_formatted'] = $application['submission_date'] ? date('d M Y H:i', strtotime($application['submission_date'])) : null;
    $application['review_date_formatted'] = $application['review_date'] ? date('d M Y H:i', strtotime($application['review_date'])) : null;
    $application['completion_date_formatted'] = $application['completion_date'] ? date('d M Y H:i', strtotime($application['completion_date'])) : null;
    $application['akta_pendirian_tanggal_formatted'] = $application['akta_pendirian_tanggal'] ? date('d M Y', strtotime($application['akta_pendirian_tanggal'])) : null;
    $application['akta_perubahan_tanggal_formatted'] = $application['akta_perubahan_tanggal'] ? date('d M Y', strtotime($application['akta_perubahan_tanggal'])) : null;
    $application['nib_date_formatted'] = $application['nib_date'] ? date('d M Y', strtotime($application['nib_date'])) : null;
    
    // Format application_number_formatted dari code_reg yang sudah acak dan punya prefix SP-
    $application['application_number_formatted'] = $application['code_reg'];


    logApiRequest('GET', '/api/applications/get_detail', ['user_id' => $currentUser['user_id'], 'code_reg' => $codeReg], ['success' => true]);

    ApiResponse::success([
        'application' => $application,
        'documents' => $documents
    ], 'Detail permohonan berhasil dimuat.');

} catch (Exception $e) {
    logApiRequest('GET', '/api/applications/get_detail', ['user_id' => $currentUser['user_id'] ?? null, 'code_reg' => $codeReg ?? null], $e->getMessage());
    ApiResponse::serverError('Gagal memuat detail permohonan: ' . $e->getMessage());
}
?>