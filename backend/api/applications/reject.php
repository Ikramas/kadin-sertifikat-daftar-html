<?php
// File: backend/api/applications/reject.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/Validator.php';
require_once '../../classes/ErrorLogger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Memastikan Admin yang mengakses
    $adminUser = JWT::requireAuth();
    if ($adminUser['role'] !== 'admin' && $adminUser['role'] !== 'super_admin') {
        ApiResponse::forbidden('Hanya administrator yang dapat menolak permohonan.');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid', 400);
    }
    $input = SecurityManager::sanitizeInput($input);

    $applicationId = $input['application_id'] ?? null;
    $notes = $input['notes'] ?? null; // Catatan wajib dari admin untuk penolakan

    $validator = new Validator();
    $validator->required('application_id', $applicationId, 'ID Permohonan wajib disediakan.');
    $validator->numeric('application_id', $applicationId, 'ID Permohonan harus angka.');
    $validator->required('notes', $notes, 'Catatan alasan penolakan wajib diisi.');
    $validator->minLength('notes', $notes, 10, 'Catatan alasan penolakan minimal 10 karakter.');
    $validator->validate();

    $database = new Database();
    $db = $database->getConnection();
    $db->beginTransaction();

    try {
        // Ambil data aplikasi saat ini
        $stmt = $db->prepare("SELECT id, user_id, status FROM applications WHERE id = ? FOR UPDATE;");
        $stmt->execute([$applicationId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            ApiResponse::notFound('Permohonan tidak ditemukan.');
        }

        // Hanya izinkan penolakan jika statusnya bukan 'completed', 'approved', atau 'rejected'
        if (in_array($application['status'], ['completed', 'approved', 'rejected'])) {
            ApiResponse::error('Permohonan tidak dapat ditolak karena sudah dalam status final atau sudah ditolak sebelumnya.', 400);
        }

        // Update status permohonan menjadi 'rejected'
        $stmtUpdateApp = $db->prepare("
            UPDATE applications SET 
                status = 'rejected', 
                reviewer_id = ?, 
                review_date = NOW(), 
                notes = COALESCE(notes, '') || ? || ' (Ditolak oleh Admin)', -- Tambahkan catatan penolakan
                updated_at = NOW()
            WHERE id = ?;
        ");
        $stmtUpdateApp->execute([$adminUser['user_id'], $notes, $applicationId]);

        // Buat notifikasi untuk pengguna
        $notificationMessage = "Permohonan SBU Anda (ID: {$applicationId}) telah ditolak. Alasan: " . htmlspecialchars($notes) . ". Silakan tinjau kembali permohonan Anda.";
        $stmtNotif = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id, created_at)
            VALUES (?, ?, ?, 'error', 'application', ?, NOW());
        ");
        $stmtNotif->execute([$application['user_id'], 'Permohonan SBU Ditolak', $notificationMessage, $applicationId]);

        $db->commit();
        logApiRequest('POST', '/api/applications/reject', ['admin_id' => $adminUser['user_id'], 'application_id' => $applicationId], 'success');
        ApiResponse::success(['application_id' => $applicationId, 'new_status' => 'rejected'], 'Permohonan berhasil ditolak.');

    } catch (Exception $e) {
        $db->rollback();
        ErrorLogger::logSystemError('application_reject_failed', $e->getMessage(), ['application_id' => $applicationId, 'admin_id' => $adminUser['user_id']]);
        logApiRequest('POST', '/api/applications/reject', $input ?? null, $e->getMessage(), $adminUser['user_id'] ?? 'N/A');
        ApiResponse::serverError('Gagal menolak permohonan: ' . $e->getMessage());
    }

} catch (Exception $e) {
    ErrorLogger::logSystemError('application_reject_api_error', $e->getMessage(), ['input' => $input ?? null, 'admin_id' => $adminUser['user_id'] ?? 'N/A']);
    logApiRequest('POST', '/api/applications/reject', $input ?? null, $e->getMessage(), $adminUser['user_id'] ?? 'N/A');
    ApiResponse::serverError('Terjadi kesalahan: ' . $e->getMessage());
}