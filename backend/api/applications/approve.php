<?php
// File: backend/api/applications/approve.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/app.php'; // Muat APP_BASE_URL, UPLOAD_DIR_BASE, ASSETS_IMAGES_DIR, SBU_FILES_UPLOAD_DIR
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/Validator.php';
require_once '../../classes/ErrorLogger.php';
require_once '../../classes/Utils.php';
require_once '../../classes/QRCodeGenerator.php'; // Muat kelas QRCodeGenerator
require_once '../../vendor/autoload.php'; // Muat Composer autoloader

use Dompdf\Dompdf;
use Dompdf\Options;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // 1. Memastikan Admin yang Melakukan Persetujuan
    $adminUser = JWT::requireAuth();
    if ($adminUser['role'] !== 'admin' && $adminUser['role'] !== 'super_admin') {
        ApiResponse::forbidden('Hanya administrator yang dapat menyetujui permohonan.');
    }

    // 2. Mengambil dan Memvalidasi Input
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid', 400);
    }
    $input = SecurityManager::sanitizeInput($input);

    $applicationId = $input['application_id'] ?? null;
    $notes = $input['notes'] ?? null; // Catatan opsional dari admin

    $validator = new Validator();
    $validator->required('application_id', $applicationId, 'ID Permohonan wajib disediakan.');
    $validator->numeric('application_id', $applicationId, 'ID Permohonan harus angka.');
    $validator->validate(); // Lakukan validasi awal

    $database = new Database();
    $db = $database->getConnection();
    $db->beginTransaction();

    try {
        // 3. Ambil Detail Aplikasi Saat Ini
        $stmtApp = $db->prepare("
            SELECT 
                a.id, a.user_id, a.status, a.application_number,
                a.requested_classification, a.business_field, a.company_qualification,
                a.sub_bidang_code, a.bidang_name, a.notes as existing_notes,
                comp.company_name, comp.address, comp.city, comp.postal_code, comp.province,
                comp.regency_city, comp.district, comp.village, comp.leader_name, comp.leader_position,
                u.uuid AS user_uuid, u.email AS user_email, u.name AS user_name, u.status AS user_current_status
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN companies comp ON u.id = comp.user_id
            WHERE a.id = ? FOR UPDATE;
        ");
        $stmtApp->execute([$applicationId]);
        $application = $stmtApp->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            ApiResponse::notFound('Permohonan tidak ditemukan.');
        }

        // Hanya izinkan persetujuan jika statusnya 'submitted' atau 'under_review'
        // Jika sudah 'approved' atau 'completed', tidak perlu diproses lagi dari sini.
        if (!in_array($application['status'], ['submitted', 'under_review'])) {
            ApiResponse::error('Permohonan tidak dapat disetujui karena statusnya tidak sesuai.', 400);
        }

        // --- Perubahan Penting: Update Status Aplikasi menjadi 'approved' saja ---
        // Generasi sertifikat dan status 'completed' akan dipicu oleh transaksi 'paid'
        $stmtUpdateApp = $db->prepare("
            UPDATE applications SET 
                status = 'approved', 
                reviewer_id = ?, 
                review_date = NOW(), 
                notes = ?, -- Catatan admin bisa menggantikan atau ditambahkan
                updated_at = NOW()
            WHERE id = ?;
        ");
        // Gunakan COALESCE untuk notes jika Anda ingin menambahkan catatan baru ke catatan yang sudah ada
        // Atau langsung set notes jika catatan baru menggantikan yang lama
        $finalNotes = $notes; // Default, catatan baru menggantikan
        // Jika Anda ingin catatan admin ditambahkan: $finalNotes = ($application['existing_notes'] ? $application['existing_notes'] . "\n" : '') . 'Disetujui oleh Admin. Catatan: ' . ($notes ?: 'Tidak ada catatan tambahan.');

        $stmtUpdateApp->execute([$adminUser['user_id'], $finalNotes, $applicationId]);

        // Buat Notifikasi untuk Pengguna Pemohon
        $notificationMessage = "Permohonan SBU Anda (No. " . $application['application_number'] . ") telah disetujui oleh admin. Silakan lanjutkan ke proses pembayaran.";
        $stmtNotif = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id, action_url, created_at)
            VALUES (?, ?, ?, 'success', 'application', ?, ?, NOW());
        ");
        $stmtNotif->execute([
            $application['user_id'],
            'Permohonan SBU Disetujui!',
            $notificationMessage,
            $applicationId,
            APP_BASE_URL . '/transactions' // Arahkan ke halaman transaksi pengguna
        ]);

        $db->commit();
        logApiRequest('POST', '/api/applications/approve', [
            'admin_id' => $adminUser['user_id'],
            'application_id' => $applicationId,
            'new_status' => 'approved'
        ], 'success');
        ApiResponse::success(['application_id' => $applicationId, 'new_status' => 'approved'], 'Permohonan berhasil disetujui. Pengguna kini dapat melakukan pembayaran.');

    } catch (Exception $e) {
        $db->rollback();
        ErrorLogger::logSystemError('application_approve_transaction_failed', $e->getMessage(), ['application_id' => $applicationId, 'admin_id' => $adminUser['user_id']]);
        logApiRequest('POST', '/api/applications/approve', $input ?? null, $e->getMessage(), $adminUser['user_id'] ?? 'N/A');
        ApiResponse::serverError('Gagal menyetujui permohonan: ' . $e->getMessage());
    }

} catch (Exception $e) {
    ErrorLogger::logSystemError('application_approve_api_error', $e->getMessage(), ['input' => $input ?? null, 'admin_id' => $adminUser['user_id'] ?? 'N/A']);
    logApiRequest('POST', '/api/applications/approve', $input ?? null, $e->getMessage(), $adminUser['user_id'] ?? 'N/A');
    ApiResponse::serverError('Terjadi kesalahan: ' . $e->getMessage());
}