<?php
// File: backend/api/applications/submit.php
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
    // Memastikan pengguna terautentikasi
    $currentUser = JWT::requireAuth();
    
    // Memvalidasi token CSRF
    CSRFProtection::requireValidToken();
    
    // Mengambil input JSON
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid', 400);
    }
    
    // Melakukan sanitasi input
    $input = SecurityManager::sanitizeInput($input);
    
    // Mengekstrak application_id dari request
    $applicationId = $input['application_id'] ?? null;

    // Validasi input
    $validator = new Validator();
    $validator->required('application_id', $applicationId, 'ID permohonan wajib disediakan.');
    $validator->numeric('application_id', $applicationId, 'ID permohonan harus angka.');
    $validator->validate(); 

    // Koneksi ke database
    $database = new Database();
    $db = $database->getConnection();
    
    // Memulai transaksi database
    $db->beginTransaction();

    try {
        // 1. Ambil detail aplikasi untuk memastikan statusnya 'draft' dan itu milik user
        $stmt = $db->prepare("
            SELECT 
                a.id, 
                a.status, 
                a.application_number, 
                c.company_name,
                a.application_type,
                a.requested_classification,
                a.business_field,
                a.company_qualification
            FROM applications a
            JOIN companies c ON a.company_id = c.id
            WHERE a.id = ? AND a.user_id = ?
            FOR UPDATE; 
        ");
        $stmt->execute([$applicationId, $currentUser['user_id']]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            ApiResponse::notFound('Permohonan tidak ditemukan atau Anda tidak memiliki akses.');
        }

        if ($application['status'] !== 'draft') {
            ApiResponse::error('Permohonan ini sudah tidak dalam status draft dan tidak dapat disubmit.', 400);
        }

        // 2. Validasi kelengkapan dokumen wajib sebelum submit
        // Daftar dokumen wajib untuk SUBMIT (sesuaikan dengan kebutuhan bisnis Anda)
        // Ini masih hardcoded, pertimbangkan untuk memindahkannya ke konfigurasi atau database
        $requiredDocsForSubmit = [
            'neraca_tahun_terakhir', 
            'surat_permohonan_subbidang'
        ]; 
        
        $uploadedDocuments = [];
        if (!empty($applicationId)) {
            $stmt_docs = $db->prepare("
                SELECT document_type, status 
                FROM documents 
                WHERE related_application_id = ? AND user_id = ? AND category = 'sbu_application'
            ");
            $stmt_docs->execute([$applicationId, $currentUser['user_id']]);
            $uploadedDocuments = $stmt_docs->fetchAll(PDO::FETCH_ASSOC);
        }

        $uploadedDocTypes = array_column($uploadedDocuments, 'document_type');
        $missingDocs = [];

        foreach ($requiredDocsForSubmit as $docType) {
            if (!in_array($docType, $uploadedDocTypes)) {
                $missingDocs[] = $docType;
            }
        }

        if (!empty($missingDocs)) {
            $db->rollBack(); 
            ApiResponse::error(
                'Dokumen tidak lengkap. Mohon unggah semua dokumen wajib sebelum submit. Dokumen yang hilang: ' . implode(', ', array_map('ucwords', str_replace('_', ' ', $missingDocs))) . '.',
                400,
                ['missing_documents' => $missingDocs]
            );
        }

        // 3. Update status aplikasi menjadi 'submitted'
        $stmt_update = $db->prepare("
            UPDATE applications 
            SET status = 'submitted', submission_date = NOW(), updated_at = NOW()
            WHERE id = ? AND user_id = ? AND status = 'draft';
        ");
        $stmt_update->execute([$applicationId, $currentUser['user_id']]);

        if ($stmt_update->rowCount() === 0) {
            ErrorLogger::logSystemError('application_submit_update_failed', 'Application status update failed or no rows affected.', ['application_id' => $applicationId, 'user_id' => $currentUser['user_id']]);
            throw new Exception("Gagal memperbarui status permohonan. Mungkin sudah diupdate atau tidak ditemukan.");
        }

        // 4. Buat notifikasi untuk admin bahwa ada permohonan baru yang disubmit
        $adminStmt = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id, created_at)
            SELECT id, 'Permohonan Baru Disubmit',
                   CONCAT('Permohonan SBU baru (No. ', ?, ') dari perusahaan ', ?, ' jenis ', ?, ' telah disubmit untuk ditinjau.'),
                   'info', 'application', ?, NOW()
            FROM users WHERE role IN ('admin', 'super_admin')
        ");
        $adminStmt->execute([
            $application['application_number'], 
            $application['company_name'],
            $application['application_type'],
            $applicationId
        ]);

        // Commit transaksi
        $db->commit();
        
        logApiRequest('POST', '/api/applications/submit', [
            'user_id' => $currentUser['user_id'],
            'application_id' => $applicationId
        ], 'success');

        ApiResponse::success(null, 'Permohonan SBU berhasil diajukan dan sedang dalam proses review.');

    } catch (Exception $e) {
        $db->rollBack(); 
        ErrorLogger::logSystemError('application_submit_transaction_failed', $e->getMessage(), ['application_id' => $applicationId, 'user_id' => $currentUser['user_id']]);
        logApiRequest('POST', '/api/applications/submit', $input ?? null, $e->getMessage());
        ApiResponse::serverError('Gagal submit permohonan: ' . $e->getMessage());
    }

} catch (Exception $e) {
    ErrorLogger::logSystemError('application_submit_api_error', $e->getMessage(), ['input' => $input ?? null]);
    logApiRequest('POST', '/api/applications/submit', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal submit permohonan: ' . $e->getMessage());
}