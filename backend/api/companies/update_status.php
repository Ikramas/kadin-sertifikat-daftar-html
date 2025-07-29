<?php
// File: backend/api/companies/update_status.php
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
    // Memastikan Admin yang Melakukan Perubahan Status
    $adminUser = JWT::requireAuth();
    if ($adminUser['role'] !== 'admin' && $adminUser['role'] !== 'super_admin') {
        ApiResponse::forbidden('Hanya administrator yang dapat memperbarui status perusahaan.');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid', 400);
    }
    $input = SecurityManager::sanitizeInput($input);

    $companyId = $input['company_id'] ?? null;
    $newStatus = $input['status'] ?? null; // 'verified' atau 'rejected'
    $notes = $input['notes'] ?? null; // Catatan opsional dari admin

    $validator = new Validator();
    $validator->required('company_id', $companyId, 'ID Perusahaan wajib disediakan.');
    $validator->numeric('company_id', $companyId, 'ID Perusahaan harus angka.');
    $validator->required('status', $newStatus, 'Status baru wajib disediakan.');
    $validator->custom('status', $newStatus, function($value) {
        return in_array($value, ['pending', 'verified', 'rejected']); // Allow 'pending' as well if needed
    }, 'Status perusahaan tidak valid.');
    $validator->validate();

    $database = new Database();
    $db = $database->getConnection();
    $db->beginTransaction();

    try {
        // Ambil data perusahaan dan user terkait (untuk FOR UPDATE)
        $stmt = $db->prepare("
            SELECT c.id, c.user_id, c.status AS company_current_status, u.status AS user_current_status
            FROM companies c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ? FOR UPDATE;
        ");
        $stmt->execute([$companyId]);
        $company = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$company) {
            ApiResponse::notFound('Perusahaan tidak ditemukan.');
        }

        // Pencegahan: Jangan ubah status jika sudah sama
        if ($company['company_current_status'] === $newStatus) {
            $db->commit();
            logApiRequest('POST', '/api/companies/update_status', ['admin_id' => $adminUser['user_id'], 'company_id' => $companyId, 'new_status' => $newStatus], 'Status sudah sama, tidak ada perubahan.');
            ApiResponse::success(null, 'Status perusahaan sudah ' . $newStatus);
        }

        // Update status perusahaan
        $stmtUpdateCompany = $db->prepare("
            UPDATE companies SET 
                status = ?, 
                verified_at = CASE WHEN ? = 'verified' THEN NOW() ELSE NULL END,
                updated_at = NOW()
            WHERE id = ?;
        ");
        $stmtUpdateCompany->execute([$newStatus, $newStatus, $companyId]);

        // Update status user terkait (penting untuk login/akses fitur)
        $userNewStatus = $company['user_current_status'];
        if ($newStatus === 'verified') {
            $userNewStatus = 'active'; // Atau 'verified'
        } else if ($newStatus === 'rejected') {
            // Jika perusahaan ditolak, user kembali ke status awal atau suspended
            // Misalnya: kembali ke 'pending_document_verification' agar bisa re-submit
            $userNewStatus = 'pending_document_verification'; 
        }

        $stmtUpdateUser = $db->prepare("
            UPDATE users SET 
                status = ?, 
                updated_at = NOW()
            WHERE id = ?;
        ");
        $stmtUpdateUser->execute([$userNewStatus, $company['user_id']]);

        // Buat notifikasi untuk pengguna (opsional)
        $notificationTitle = '';
        $notificationMessage = '';
        $notificationType = 'info';

        if ($newStatus === 'verified') {
            $notificationTitle = 'Verifikasi Perusahaan Disetujui!';
            $notificationMessage = 'Selamat! Data dan dokumen perusahaan Anda telah berhasil diverifikasi oleh admin. Anda sekarang dapat mengajukan permohonan SBU.';
            $notificationType = 'success';
        } else if ($newStatus === 'rejected') {
            $notificationTitle = 'Verifikasi Perusahaan Ditolak';
            $notificationMessage = 'Verifikasi data dan dokumen perusahaan Anda ditolak. Silakan periksa kembali data Anda dan unggah ulang dokumen jika diperlukan. Catatan Admin: ' . ($notes ?: 'Tidak ada catatan.');
            $notificationType = 'error';
        }

        if (!empty($notificationTitle)) {
            $stmtNotif = $db->prepare("
                INSERT INTO notifications (user_id, title, message, type, related_type, related_id, created_at)
                VALUES (?, ?, ?, ?, 'company', ?, NOW());
            ");
            $stmtNotif->execute([$company['user_id'], $notificationTitle, $notificationMessage, $notificationType, $companyId]);
        }

        $db->commit();
        logApiRequest('POST', '/api/companies/update_status', ['admin_id' => $adminUser['user_id'], 'company_id' => $companyId, 'new_status' => $newStatus], 'success');
        ApiResponse::success(['company_id' => $companyId, 'new_status' => $newStatus, 'user_new_status' => $userNewStatus], 'Status perusahaan berhasil diperbarui menjadi ' . $newStatus);

    } catch (Exception $e) {
        $db->rollback();
        ErrorLogger::logSystemError('company_status_update_failed', $e->getMessage(), ['company_id' => $companyId, 'admin_id' => $adminUser['user_id']]);
        logApiRequest('POST', '/api/companies/update_status', $input ?? null, $e->getMessage(), $adminUser['user_id'] ?? 'N/A');
        ApiResponse::serverError('Gagal memperbarui status perusahaan: ' . $e->getMessage());
    }

} catch (Exception $e) {
    ErrorLogger::logSystemError('company_status_update_api_error', $e->getMessage(), ['input' => $input ?? null, 'admin_id' => $adminUser['user_id'] ?? 'N/A']);
    logApiRequest('POST', '/api/companies/update_status', $input ?? null, $e->getMessage(), $adminUser['user_id'] ?? 'N/A');
    ApiResponse::serverError('Terjadi kesalahan: ' . $e->getMessage());
}