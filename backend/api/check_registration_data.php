<?php
// File: backend/api/check_registration_data.php
// Endpoint ini digunakan untuk memeriksa apakah NPWP atau NIB sudah terdaftar di database.

require_once '../../error_handler.php';      // Untuk penanganan error global
require_once '../../config/cors.php';         // Untuk konfigurasi CORS
require_once '../../config/database.php';     // Untuk koneksi database
require_once '../../classes/ApiResponse.php'; // Untuk standarisasi respons API
require_once '../../classes/ErrorLogger.php'; // Untuk logging error sistem

// Pastikan metode permintaan adalah POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

// Menerima input JSON dari body permintaan
$input = json_decode(file_get_contents('php://input'), true);

// Ekstrak tipe dan nilai dari input
$type = $input['type'] ?? '';   // Bisa 'npwp' atau 'nib'
$value = $input['value'] ?? ''; // Nilai NPWP atau NIB yang akan dicek

// Validasi dasar input
if (empty($type) || empty($value)) {
    ErrorLogger::logSystemError('check_registration_data_missing_params', 'Missing type or value in request.', ['input' => $input]);
    ApiResponse::error('Tipe dan nilai data yang ingin dicek harus disediakan.', 400);
}

try {
    // Inisialisasi koneksi database
    $database = new Database();
    $db = $database->getConnection();

    $found = false; // Status apakah data ditemukan atau tidak
    $details = null; // Detail data jika ditemukan (opsional)

    // Logika pengecekan berdasarkan tipe
    if ($type === 'npwp') {
        // Query untuk memeriksa keberadaan NPWP di tabel 'companies'
        // Gunakan `COLLATE utf8mb4_bin` jika Anda perlu pencarian case-sensitive dan database Anda mendukungnya.
        // Jika tidak, cukup `WHERE npwp = ?`
        $stmt = $db->prepare("SELECT id, company_name, nib, npwp FROM companies WHERE npwp = ? LIMIT 1");
        $stmt->execute([$value]);
        $companyData = $stmt->fetch(PDO::FETCH_ASSOC); // Ambil data perusahaan jika ada

        if ($companyData) {
            $found = true;
            // Hanya kirim detail yang relevan, hindari data sensitif
            $details = [
                'id' => $companyData['id'],
                'company_name' => $companyData['company_name'],
                'nib' => $companyData['nib'],
                'npwp' => $companyData['npwp'],
            ];
            // ErrorLogger::logSystemError('check_registration_data_npwp_found', 'NPWP found in DB.', ['value' => $value]); // Dinonaktifkan untuk mengurangi log yang tidak perlu
        } else {
            // ErrorLogger::logSystemError('check_registration_data_npwp_not_found', 'NPWP not found in DB.', ['value' => $value]); // Dinonaktifkan
        }
    } elseif ($type === 'nib') {
        // Query untuk memeriksa keberadaan NIB di tabel 'companies'
        $stmt = $db->prepare("SELECT id, company_name, npwp, nib FROM companies WHERE nib = ? LIMIT 1");
        $stmt->execute([$value]);
        $companyData = $stmt->fetch(PDO::FETCH_ASSOC); // Ambil data perusahaan jika ada

        if ($companyData) {
            $found = true;
            // Hanya kirim detail yang relevan, hindari data sensitif
            $details = [
                'id' => $companyData['id'],
                'company_name' => $companyData['company_name'],
                'npwp' => $companyData['npwp'],
                'nib' => $companyData['nib'],
            ];
            // ErrorLogger::logSystemError('check_registration_data_nib_found', 'NIB found in DB.', ['value' => $value]); // Dinonaktifkan
        } else {
            // ErrorLogger::logSystemError('check_registration_data_nib_not_found', 'NIB not found in DB.', ['value' => $value]); // Dinonaktifkan
        }
    } else {
        // Jika tipe pengecekan tidak didukung
        ErrorLogger::logSystemError('check_registration_data_invalid_type', 'Invalid check type provided.', ['type' => $type, 'value' => $value]);
        ApiResponse::error('Tipe pengecekan tidak valid.', 400);
    }

    // Kirim respons sukses
    ApiResponse::success([
        'found' => $found,
        'type' => $type,
        'value' => $value,
        'details' => $details // Detail data akan disertakan jika ditemukan
    ], 'Pengecekan berhasil.');

} catch (PDOException $e) {
    // Tangani error database
    ErrorLogger::logSystemError('check_registration_data_db_error', $e->getMessage(), ['type' => $type, 'value' => $value]);
    ApiResponse::serverError('Terjadi kesalahan database saat melakukan pengecekan.');
} catch (Exception $e) {
    // Tangani error umum lainnya
    ErrorLogger::logSystemError('check_registration_data_general_error', $e->getMessage(), ['type' => $type, 'value' => $value]);
    ApiResponse::serverError('Gagal melakukan pengecekan: ' . $e->getMessage());
}
