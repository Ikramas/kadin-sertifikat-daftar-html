<?php
// File: backend/api/transactions/create_invoice.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/app.php'; 
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/Validator.php';
require_once '../../classes/ErrorLogger.php'; 
require_once '../../classes/Utils.php';
require_once '../../classes/QRCodeGenerator.php'; // Muat kelas QRCodeGenerator
require_once '../../vendor/autoload.php'; // <-- PASTIKAN BARIS INI ADA

// use Dompdf\Dompdf; // Tidak digunakan di sini, bisa dihapus
// use Dompdf\Options; // Tidak digunakan di sini, bisa dihapus

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // 1. Memastikan Admin yang Membuat Invoice
    $adminUser = JWT::requireAuth(); 
    if ($adminUser['role'] !== 'admin' && $adminUser['role'] !== 'super_admin') {
        ApiResponse::forbidden('Hanya administrator yang dapat membuat invoice.');
    }

    // 2. Mengambil dan Memvalidasi Input
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid', 400);
    }
    $input = SecurityManager::sanitizeInput($input);

    $applicationId = $input['application_id'] ?? null;
    $amount = $input['amount'] ?? null;
    $notes = $input['notes'] ?? null;

    $validator = new Validator();
    $validator->required('application_id', $applicationId, 'ID Permohonan wajib disediakan.');
    $validator->numeric('application_id', $applicationId, 'ID Permohonan harus angka.');
    $validator->required('amount', $amount, 'Jumlah pembayaran wajib diisi.');
    $validator->numeric('amount', $amount, 'Jumlah pembayaran harus berupa angka.');
    $validator->min('amount', $amount, 0, 'Jumlah pembayaran tidak boleh negatif.');
    $validator->validate();

    $database = new Database();
    $db = $database->getConnection();
    $db->beginTransaction();

    try {
        // 3. Ambil Data Aplikasi, Perusahaan, dan User terkait secara otomatis
        $stmtApp = $db->prepare("
            SELECT 
                a.id AS application_id, a.user_id, a.application_number, a.status AS application_status,
                c.id AS company_id, c.company_name,
                u.email AS user_email
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN companies c ON a.company_id = c.id
            WHERE a.id = ? FOR UPDATE; 
        ");
        $stmtApp->execute([$applicationId]);
        $application = $stmtApp->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            ApiResponse::notFound('Permohonan tidak ditemukan.');
        }

        // Pencegahan: Hanya buat invoice untuk aplikasi yang 'approved' atau 'submitted'/'under_review'
        // dan belum memiliki transaksi 'pending' atau 'paid'
        $stmtExistingTrans = $db->prepare("SELECT COUNT(*) FROM transactions WHERE application_id = ? AND status IN ('pending', 'paid')");
        $stmtExistingTrans->execute([$applicationId]);
        if ($stmtExistingTrans->fetchColumn() > 0) {
            ApiResponse::error('Permohonan ini sudah memiliki transaksi pending atau sudah dibayar.', 400);
        }

        // Periksa status aplikasi: Hanya izinkan buat invoice untuk yang sudah disetujui atau siap bayar
        if (!in_array($application['application_status'], ['approved', 'submitted', 'under_review'])) {
            ApiResponse::error('Status permohonan tidak memungkinkan pembuatan invoice. Permohonan harus sudah disetujui atau dalam review.', 400);
        }

        // 4. Generate Nomor Transaksi Unik
        $transactionNumber = Utils::generateUniqueCode('TRX-', 10, $db, 'transactions', 'transaction_number');

        // 5. Masukkan ke Tabel Transactions
        $stmtInsertTrans = $db->prepare("
            INSERT INTO transactions (
                user_id, application_id, transaction_number, amount, status,
                payment_method, notes -- HAPUS created_at dari sini, karena default di DB
            ) VALUES (?, ?, ?, ?, ?, ?, ?);
        ");
        // Metode pembayaran default ke 'bank_transfer'
        $stmtInsertTrans->execute([
            $application['user_id'],
            $application['application_id'],
            $transactionNumber,
            $amount,
            'pending', // Status awal selalu pending
            'bank_transfer', 
            $notes
        ]);
        $transactionId = $db->lastInsertId();

        // 6. Buat Notifikasi untuk Pengguna (Invoice Baru Diterbitkan)
        $notificationMessage = "Invoice baru (No. " . $transactionNumber . ") telah diterbitkan untuk permohonan SBU Anda (" . $application['application_number'] . "). Jumlah: Rp " . number_format($amount, 2, ',', '.') . ". Mohon segera lakukan pembayaran.";
        $stmtNotif = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id, action_url, created_at)
            VALUES (?, ?, ?, 'info', 'transaction', ?, ?, NOW());
        ");
        $stmtNotif->execute([
            $application['user_id'], 
            'Invoice Baru Diterbitkan', 
            $notificationMessage,
            $transactionId,
            APP_BASE_URL . '/transactions' // Link ke halaman transaksi pengguna
        ]);

        $db->commit();
        // logApiRequest('POST', '/api/transactions/create_invoice', [ // Komentari jika masih menyebabkan crash
        //     'admin_id' => $adminUser['user_id'],
        //     'application_id' => $applicationId,
        //     'amount' => $amount,
        //     'transaction_number' => $transactionNumber
        // ], 'success');

        ApiResponse::success([
            'transaction_id' => $transactionId,
            'transaction_number' => $transactionNumber,
            'message' => 'Invoice berhasil dibuat dan dikirim ke pengguna.'
        ], 'Invoice berhasil dibuat dan status transaksi pending.');

    } catch (Exception $e) {
        $db->rollback();
        ErrorLogger::logSystemError('create_invoice_transaction_failed', $e->getMessage(), [
            'admin_id' => $adminUser['user_id'],
            'application_id' => $applicationId,
            'input_data' => $input
        ]);
        // logApiRequest('POST', '/api/transactions/create_invoice', $input ?? null, $e->getMessage(), $adminUser['user_id']); // Komentari jika masih menyebabkan crash
        ApiResponse::serverError('Gagal membuat invoice: ' . $e->getMessage());
    }

} catch (Exception $e) {
    ErrorLogger::logSystemError('create_invoice_api_error', $e->getMessage(), [
        'input_data' => $input ?? null, 
        'admin_id' => $adminUser['user_id'] ?? 'N/A'
    ]);
    // logApiRequest('POST', '/api/transactions/create_invoice', $input ?? null, $e->getMessage(), $adminUser['user_id'] ?? 'N/A'); // Komentari jika masih menyebabkan crash
    ApiResponse::serverError('Terjadi kesalahan: ' . $e->getMessage());
}