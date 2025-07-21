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
    $validator->validate(); // Akan melempar ApiResponse::error jika validasi gagal

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
                c.company_name 
            FROM applications a
            JOIN companies c ON a.company_id = c.id
            WHERE a.id = ? AND a.user_id = ?
            FOR UPDATE; -- Mengunci baris untuk menghindari race condition
        ");
        $stmt->execute([$applicationId, $currentUser['user_id']]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            ApiResponse::notFound('Permohonan tidak ditemukan atau Anda tidak memiliki akses.');
        }

        if ($application['status'] !== 'draft') {
            ApiResponse::error('Permohonan ini sudah tidak dalam status draft dan tidak dapat disubmit.', 400);
        }

        // 2. Validasi kelengkapan dokumen (SANGAT DIREKOMENDASIKAN)
        // Ini adalah bagian KRITIS untuk memastikan semua dokumen wajib sudah diunggah
        // sebelum permohonan bisa disubmit. Anda harus menyesuaikan daftar dokumen wajib di sini.
        $stmt_docs = $db->prepare("
            SELECT document_type, status 
            FROM documents 
            WHERE related_application_id = ? AND user_id = ?
        ");
        $stmt_docs->execute([$applicationId, $currentUser['user_id']]);
        $uploadedDocuments = $stmt_docs->fetchAll(PDO::FETCH_ASSOC);

        // Daftar dokumen wajib untuk SUBMIT (sesuaikan dengan kebutuhan bisnis Anda)
        // Contoh: neraca_tahun_terakhir, surat_permohonan_subbidang
        $requiredDocsForSubmit = ['neraca_tahun_terakhir', 'surat_permohonan_subbidang']; 
        $uploadedDocTypes = array_column($uploadedDocuments, 'document_type');
        $missingDocs = [];

        foreach ($requiredDocsForSubmit as $docType) {
            if (!in_array($docType, $uploadedDocTypes)) {
                $missingDocs[] = $docType;
            }
        }

        if (!empty($missingDocs)) {
            $db->rollBack(); // Rollback transaksi jika dokumen tidak lengkap
            ApiResponse::error(
                'Dokumen tidak lengkap. Mohon unggah semua dokumen wajib sebelum submit. Dokumen yang hilang: ' . implode(', ', $missingDocs) . '.',
                400,
                ['missing_documents' => $missingDocs]
            );
        }

        // Opsional: Validasi status dokumen (misal: semua dokumen wajib harus 'verified')
        // Ini tergantung alur verifikasi Anda. Jika verifikasi admin dilakukan setelah submit,
        // maka bagian ini tidak perlu terlalu ketat. Tapi jika dokumen harus diverifikasi sistem otomatis
        // sebelum submit, maka uncomment dan sesuaikan bagian ini.
        /*
        foreach ($uploadedDocuments as $doc) {
            if (in_array($doc['document_type'], $requiredDocsForSubmit) && $doc['status'] !== 'verified') {
                $db->rollBack();
                ApiResponse::error('Beberapa dokumen wajib belum diverifikasi. Mohon tunggu verifikasi dokumen.', 400);
            }
        }
        */

        // 3. Update status aplikasi menjadi 'submitted'
        $stmt_update = $db->prepare("
            UPDATE applications 
            SET status = 'submitted', submission_date = NOW() 
            WHERE id = ? AND user_id = ? AND status = 'draft';
        ");
        $stmt_update->execute([$applicationId, $currentUser['user_id']]);

        if ($stmt_update->rowCount() === 0) {
            // Ini bisa terjadi jika status sudah berubah di luar transaksi ini atau ID tidak cocok
            throw new Exception("Gagal memperbarui status permohonan. Mungkin sudah diupdate atau tidak ditemukan.");
        }

        // 4. Buat notifikasi untuk admin bahwa ada permohonan baru yang disubmit
        $adminStmt = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id, created_at)
            SELECT id, 'Permohonan Baru Disubmit',
                   CONCAT('Permohonan SBU baru dengan nomor ', ?, ' dari perusahaan ', ?, ' telah disubmit untuk ditinjau.'),
                   'info', 'application', ?, NOW()
            FROM users WHERE role IN ('admin', 'super_admin')
        ");
        $adminStmt->execute([
            $application['application_number'], 
            $application['company_name'], 
            $applicationId
        ]);

        // Commit transaksi
        $db->commit();
        
        logApiRequest('POST', '/api/applications/submit', [
            'user_id' => $currentUser['user_id'],
            'application_id' => $applicationId
        ], ['success' => true]);

        ApiResponse::success(null, 'Permohonan SBU berhasil diajukan dan sedang dalam proses review.');

    } catch (Exception $e) {
        $db->rollBack(); // Pastikan rollback jika ada error dalam transaksi
        throw $e; // Lempar kembali exception untuk ditangkap di blok catch luar
    }

} catch (Exception $e) {
    logApiRequest('POST', '/api/applications/submit', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal submit permohonan: ' . $e->getMessage());
}
?>