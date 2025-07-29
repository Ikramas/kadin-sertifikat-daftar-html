<?php
// File: backend/api/transactions/update_status.php

// --- PERBAIKAN KRITIS: Definisikan ROOT_PATH secara eksplisit di sini ---
define('ROOT_PATH', dirname(__DIR__, 2) . '/');
// --- AKHIR PERBAIKAN KRITIS ---

require_once ROOT_PATH . 'error_handler.php';
require_once ROOT_PATH . 'config/cors.php';
require_once ROOT_PATH . 'config/database.php';
require_once ROOT_PATH . 'config/app.php'; 
require_once ROOT_PATH . 'classes/ApiResponse.php';
require_once ROOT_PATH . 'classes/JWT.php';
require_once ROOT_PATH . 'classes/SecurityManager.php';
require_once ROOT_PATH . 'classes/Validator.php';
require_once ROOT_PATH . 'classes/ErrorLogger.php'; 
require_once ROOT_PATH . 'classes/Utils.php';
require_once ROOT_PATH . 'classes/QRCodeGenerator.php';
require_once ROOT_PATH . 'vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    error_log("DEBUG: update_status.php - Request received.");

    $adminUser = JWT::requireAuth(); 
    if ($adminUser['role'] !== 'admin' && $adminUser['role'] !== 'super_admin') {
        error_log("DEBUG: update_status.php - Forbidden access by non-admin user: " . ($adminUser['user_id'] ?? 'N/A'));
        ApiResponse::forbidden('Hanya administrator yang dapat memperbarui status transaksi.');
    }
    error_log("DEBUG: update_status.php - Admin user authenticated: " . $adminUser['user_id']);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        error_log("DEBUG: update_status.php - Invalid JSON input.");
        ApiResponse::error('Data JSON tidak valid', 400);
    }
    $input = SecurityManager::sanitizeInput($input);

    $transactionId = $input['transaction_id'] ?? null;
    $newStatus = $input['status'] ?? null;
    $notes = $input['notes'] ?? null;

    $validator = new Validator();
    $validator->required('transaction_id', $transactionId, 'ID Transaksi wajib disediakan.');
    $validator->numeric('transaction_id', $transactionId, 'ID Transaksi harus angka.');
    $validator->required('status', $newStatus, 'Status baru wajib disediakan.');
    $validator->custom('status', $newStatus, function($value) {
        return in_array($value, ['pending', 'paid', 'failed', 'cancelled', 'refunded']);
    }, 'Status transaksi tidak valid.');
    $validator->validate();
    error_log("DEBUG: update_status.php - Input validated. Trans ID: $transactionId, New Status: $newStatus");


    $database = new Database();
    $db = $database->getConnection();
    $db->beginTransaction();
    error_log("DEBUG: update_status.php - Database transaction started.");

    try {
        $stmtTrans = $db->prepare("SELECT id, user_id, application_id, status FROM transactions WHERE id = ? FOR UPDATE;");
        $stmtTrans->execute([$transactionId]);
        $transaction = $stmtTrans->fetch(PDO::FETCH_ASSOC);

        if (!$transaction) {
            error_log("DEBUG: update_status.php - Transaction not found: " . $transactionId);
            ApiResponse::notFound('Transaksi tidak ditemukan.');
        }
        error_log("DEBUG: update_status.php - Transaction found. Current Status: " . $transaction['status'] . ", App ID: " . $transaction['application_id']);
        
        if (in_array($transaction['status'], ['paid', 'cancelled', 'refunded']) && $newStatus !== 'paid') {
            error_log("DEBUG: update_status.php - Attempt to change final status. Current: " . $transaction['status'] . ", New: " . $newStatus);
            ApiResponse::error('Status transaksi ini tidak dapat diubah lagi.', 400);
        }
        if ($transaction['status'] === 'paid' && $newStatus === 'paid') {
            $db->commit();
            error_log("DEBUG: update_status.php - Transaction already PAID. No change needed.");
            ApiResponse::success(null, 'Status transaksi sudah berhasil dibayar.');
        }

        // Update Status Transaksi
        $paidAt = ($newStatus === 'paid') ? date('Y-m-d H:i:s') : null;
        $stmtUpdateTrans = $db->prepare("
            UPDATE transactions SET 
                status = ?, 
                paid_at = COALESCE(?, paid_at), 
                notes = COALESCE(?, notes),
                updated_at = NOW()
            WHERE id = ?;
        ");
        $stmtUpdateTrans->execute([$newStatus, $paidAt, $notes, $transactionId]);
        error_log("DEBUG: update_status.php - Transaction status updated to: " . $newStatus);


        // Logika Otomatisasi Penerbitan Sertifikat (JIKA status menjadi 'paid')
        if ($newStatus === 'paid' && !empty($transaction['application_id'])) {
            $applicationId = $transaction['application_id'];
            error_log("DEBUG: update_status.php - New status is PAID, processing certificate for App ID: " . $applicationId);
            
            // Ambil data aplikasi terkait
            $stmtApp = $db->prepare("
                SELECT 
                    a.id, a.user_id, a.status, a.application_number,
                    a.requested_classification, a.business_field, a.company_qualification,
                    a.sub_bidang_code, a.bidang_name, a.application_type,
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
                error_log("DEBUG: update_status.php - Related application not found for ID: " . $applicationId);
                throw new Exception('Permohonan terkait tidak ditemukan.');
            }
            error_log("DEBUG: update_status.php - Application found. App Status: " . $application['status']);

            // Kondisi untuk memicu pembuatan sertifikat
            $stmtCheckCert = $db->prepare("SELECT COUNT(*) FROM certificates WHERE application_id = ?");
            $stmtCheckCert->execute([$applicationId]);
            $certificateExists = $stmtCheckCert->fetchColumn() > 0;

            if ($certificateExists) {
                error_log("DEBUG: update_status.php - Certificate already exists for App ID: " . $applicationId . ". Skipping generation.");
            } else if ($application['status'] === 'approved' || $application['status'] === 'completed') {
                error_log("DEBUG: update_status.php - Application is 'approved' or 'completed' and no certificate exists. Proceeding with generation.");
                // Logika Penerbitan Sertifikat
                $newCertificateNumber = Utils::generateUniqueCertificateNumber($db);
                $nationalRegNumber = Utils::generateNationalRegNumber($db); 
                $issuedDate = date('Y-m-d'); 
                $expiryDate = date('Y-m-d', strtotime('+1 year', strtotime($issuedDate)));

                // --- PERBAIKAN KRITIS: Set certificate_file_path ke NULL ---
                $sbuFilePath = NULL; 
                // --- AKHIR PERBAIKAN KRITIS ---

                $stmtInsertCert = $db->prepare("
                    INSERT INTO certificates (
                        user_id, application_id, certificate_number, national_reg_number,
                        classification, business_field, qualification,
                        issued_date, expiry_date, status, issuer_name, certificate_file_path
                        -- created_at DIHAPUS karena memiliki DEFAULT CURRENT_TIMESTAMP di skema DB
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    );
                ");
                
                $stmtInsertCert->execute([
                    $application['user_id'],
                    $application['id'],
                    $newCertificateNumber,
                    $nationalRegNumber,
                    $application['requested_classification'], 
                    $application['business_field'],         
                    $application['company_qualification'],  
                    $issuedDate,
                    $expiryDate,
                    'active', 
                    'KADIN INDONESIA', 
                    $sbuFilePath // Sekarang akan menjadi NULL di database
                ]);
                $certificateId = $db->lastInsertId();
                error_log("DEBUG: update_status.php - Certificate DB entry created. ID: " . $certificateId . ", Number: " . $newCertificateNumber);


                // Update Status Aplikasi menjadi 'completed'
                $stmtUpdateApp = $db->prepare("
                    UPDATE applications SET 
                        status = 'completed', 
                        completion_date = NOW(),
                        reviewer_id = ?, 
                        updated_at = NOW()
                    WHERE id = ?;
                ");
                $stmtUpdateApp->execute([$adminUser['user_id'], $applicationId]);
                error_log("DEBUG: update_status.php - Application status updated to 'completed' for App ID: " . $applicationId);


                // --- PERBAIKAN KRITIS: Hapus semua logika generate PDF dan file_put_contents di sini ---
                // PDF akan digenerate secara on-demand oleh generate_pdf.php
                // Logika Dompdf, HTML, file_put_contents di sini DIHAPUS
                // ------------------------------------------------------------------------------------

                // Buat Notifikasi untuk Pengguna Pemohon (tetap)
                $notificationMessage = "Sertifikat SBU Anda (No. " . $newCertificateNumber . ") telah berhasil diterbitkan dan berlaku hingga " . date('d F Y', strtotime($expiryDate)) . ". Anda dapat melihat dan mengunduhnya di bagian Sertifikat.";
                $stmtNotif = $db->prepare("
                    INSERT INTO notifications (user_id, title, message, type, related_type, related_id, action_url, created_at)
                    VALUES (?, ?, ?, 'success', 'certificate', ?, ?, NOW());
                ");
                $stmtNotif->execute([
                    $application['user_id'], 
                    'Sertifikat SBU Diterbitkan!', 
                    $notificationMessage,
                    $certificateId,
                    APP_BASE_URL . '/certificates' 
                ]);
                error_log("DEBUG: update_status.php - Notification created for user: " . $application['user_id']);

            }
        }
        
        $db->commit();
        error_log("DEBUG: update_status.php - Transaction committed.");
        ApiResponse::success(null, 'Status transaksi berhasil diperbarui.');

    } catch (Exception $e) {
        $db->rollback();
        error_log("DEBUG: update_status.php - Transaction rolled back due to error: " . $e->getMessage());
        ErrorLogger::logSystemError('transaction_status_update_failed', $e->getMessage(), ['transaction_id' => $transactionId, 'admin_id' => $adminUser['user_id']]);
        ApiResponse::serverError('Gagal memperbarui status transaksi: ' . $e->getMessage());
    }

} catch (Exception $e) {
    error_log("DEBUG: update_status.php - API level error: " . $e->getMessage());
    ErrorLogger::logSystemError('transaction_status_update_api_error', $e->getMessage(), ['input' => $input ?? null, 'admin_id' => $adminUser['user_id'] ?? 'N/A']);
    ApiResponse::serverError('Terjadi kesalahan: ' . $e->getMessage());
}