<?php
// backend/api/applications/approve.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/Validator.php';
// require_once '../../vendor/autoload.php'; // Untuk Dompdf, QR Code, dan mungkin UUID library (Ramsey\Uuid)

// Fungsi generate UUID (jika belum menggunakan Ramsey\Uuid)
if (!function_exists('generateUuidV4')) {
    function generateUuidV4() {
        return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
            mt_rand( 0, 0xffff ),
            mt_rand( 0, 0x0fff ) | 0x4000,
            mt_rand( 0, 0x3fff ) | 0x8000,
            mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
        );
    }
}

// Fungsi untuk menghasilkan nomor sertifikat unik
function generateUniqueCertificateNumber($db) {
    $prefix = 'SBU-KI-'; // Contoh prefix: SBU-KADIN-INDONESIA
    $year = date('Y');
    $maxAttempts = 100; // Batasi upaya untuk menghindari loop tak terbatas

    for ($i = 0; $i < $maxAttempts; $i++) {
        $randomNumber = str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT); // 5 digit angka acak
        $certNumber = $prefix . $year . '-' . $randomNumber;

        $stmt = $db->prepare("SELECT COUNT(*) FROM certificates WHERE certificate_number = ?");
        $stmt->execute([$certNumber]);
        if ($stmt->fetchColumn() == 0) {
            return $certNumber;
        }
    }
    throw new Exception("Gagal membuat nomor sertifikat unik setelah beberapa upaya.");
}


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // 1. Memastikan Admin yang Melakukan Approval
    $adminUser = JWT::requireAuth(); // Pastikan ada token & user login
    if ($adminUser['role'] !== 'admin' && $adminUser['role'] !== 'super_admin') {
        ApiResponse::forbidden('Hanya administrator yang dapat menyetujui permohonan.');
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $input = SecurityManager::sanitizeInput($input);

    $applicationId = $input['application_id'] ?? null;
    // $certificateFilePath = $input['certificate_file_path'] ?? null; // Jika admin upload file PDF manual

    $validator = new Validator();
    $validator->required('application_id', $applicationId, 'ID Permohonan wajib disediakan.');
    // Optional: validator->required('certificate_file_path', $certificateFilePath, 'Path file sertifikat wajib.');
    $validator->validate();

    $database = new Database();
    $db = $database->getConnection();
    $db->beginTransaction();

    try {
        // 2. Ambil Data Aplikasi & Double-Check User Ownership (Pengecekan Ganda)
        // Ambil data aplikasi, termasuk user_id pemohon dan UUID-nya
        $stmtApp = $db->prepare("
            SELECT 
                a.id, a.user_id, a.status, a.requested_classification, a.business_field, a.company_qualification,
                u.uuid AS user_uuid, u.email AS user_email, u.name AS user_name, u.status AS user_current_status
            FROM applications a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ? AND a.status = 'under_review' FOR UPDATE;
        ");
        $stmtApp->execute([$applicationId]);
        $application = $stmtApp->fetch(PDO::FETCH_ASSOC);

        if (!$application) {
            // Jika aplikasi tidak ditemukan, atau statusnya bukan 'under_review', atau user tidak valid
            ApiResponse::notFound('Permohonan tidak ditemukan atau tidak dalam status untuk disetujui.');
        }

        // Konfirmasi kepemilikan aplikasi oleh pengguna yang sesuai
        // Meskipun ini adalah aksi admin, penting untuk memastikan aplikasi valid
        // dan milik pengguna yang tidak dibekukan atau dihapus.
        // Cek juga bahwa status pengguna pemohon adalah 'verified' atau 'active'.
        if ($application['user_current_status'] !== 'active' && $application['user_current_status'] !== 'verified') {
             // Ini skenario yang tidak biasa, karena aplikasi disetujui hanya jika user verified
             // Tapi ini bisa jadi lapisan keamanan ekstra
            ApiResponse::error('Pengguna pemohon tidak dalam status yang valid untuk persetujuan sertifikat.', 400);
        }

        // 3. Generate Nomor SBU dan Tanggal Otomatis
        $newCertificateNumber = generateUniqueCertificateNumber($db);
        $issuedDate = date('Y-m-d'); // Tanggal persetujuan adalah tanggal saat ini
        $expiryDate = date('Y-m-d', strtotime('+3 years', strtotime($issuedDate))); // 3 tahun dari issued_date

        // 4. Salin Data Aplikasi ke Tabel Certificates & Buat Entri Sertifikat Baru
        $stmtInsertCert = $db->prepare("
            INSERT INTO certificates (
                user_id, application_id, certificate_number, classification, business_field, qualification,
                issued_date, expiry_date, status, issuer_name, certificate_file_path, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'KADIN INDONESIA', ?, NOW()
            );
        ");
        
        // Asumsi: certificate_file_path akan menjadi lokasi file PDF yang digenerate.
        // Untuk demo, kita bisa placeholder dulu atau generate di sini.
        // $generatedPdfPath = 'path/to/generated/sbu_' . $newCertificateNumber . '.pdf'; 
        // Contoh sederhana, Anda perlu integrasi Dompdf/lainnya untuk membuat file PDF aktual di sini.
        $dummyGeneratedFilePath = 'sbu_files/sbu_' . $newCertificateNumber . '.pdf'; // Contoh path

        $stmtInsertCert->execute([
            $application['user_id'],
            $application['id'],
            $newCertificateNumber,
            $application['requested_classification'], // Disalin dari applications
            $application['business_field'],         // Disalin dari applications
            $application['company_qualification'],  // Disalin dari applications
            $issuedDate,
            $expiryDate,
            $dummyGeneratedFilePath // Path file sertifikat PDF
        ]);
        $certificateId = $db->lastInsertId();

        // 5. Perbarui Status Aplikasi menjadi 'completed' atau 'approved'
        $stmtUpdateApp = $db->prepare("
            UPDATE applications SET 
                status = 'completed', 
                completion_date = NOW(),
                reviewer_id = ?, -- ID admin yang menyetujui
                updated_at = NOW()
            WHERE id = ?;
        ");
        $stmtUpdateApp->execute([$adminUser['user_id'], $applicationId]);

        // 6. Buat Notifikasi untuk Pengguna Pemohon
        $notificationMessage = "Sertifikat SBU Anda (No. " . $newCertificateNumber . ") telah berhasil diterbitkan dan berlaku hingga " . date('d F Y', strtotime($expiryDate)) . ".";
        $stmtNotif = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id, action_url, created_at)
            VALUES (?, ?, ?, 'success', 'certificate', ?, ?, NOW());
        ");
        $stmtNotif->execute([
            $application['user_id'], 
            'Sertifikat SBU Diterbitkan!', 
            $notificationMessage,
            $certificateId,
            '/certificates' // URL untuk melihat daftar sertifikat di frontend
        ]);

        $db->commit();

        logApiRequest('POST', '/api/applications/approve', [
            'admin_id' => $adminUser['user_id'],
            'application_id' => $applicationId,
            'certificate_id' => $certificateId,
            'certificate_number' => $newCertificateNumber
        ], ['success' => true]);

        ApiResponse::success([
            'certificate_id' => $certificateId,
            'certificate_number' => $newCertificateNumber,
            'status_aplikasi' => 'completed'
        ], 'Permohonan berhasil disetujui dan sertifikat telah diterbitkan.');

    } catch (Exception $e) {
        $db->rollback();
        logApiRequest('POST', '/api/applications/approve', $input ?? null, $e->getMessage());
        ApiResponse::serverError('Gagal menyetujui permohonan: ' . $e->getMessage());
    }

} catch (Exception $e) {
    logApiRequest('POST', '/api/applications/approve', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Terjadi kesalahan: ' . $e->getMessage());
}