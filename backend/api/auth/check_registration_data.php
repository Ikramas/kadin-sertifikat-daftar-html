<?php
// File: backend/api/auth/check_registration_data.php
// Endpoint ini digunakan untuk memeriksa apakah NPWP atau NIB sudah terdaftar di database.

// Hapus require_once ini jika menyebabkan konflik atau error yang tidak terlihat.
// Kita akan menangani error secara eksplisit.
// require_once '../../error_handler.php';      
require_once '../../config/cors.php';         // Untuk konfigurasi CORS
require_once '../../config/database.php';     // Untuk koneksi database
// require_once '../../classes/ApiResponse.php'; // Hapus ini, kita tidak akan pakai ApiResponse di sini
// require_once '../../classes/ErrorLogger.php'; // Hapus ini, log manual atau tambahkan jika benar-benar perlu

// Fungsi helper untuk membersihkan NIB dari format (hanya angka)
// NIB umumnya hanya angka, jadi fungsi ini tetap relevan.
if (!function_exists('cleanNib')) {
    function cleanNib($nib) {
        return preg_replace('/[^0-9]/', '', $nib);
    }
}

// Pastikan metode permintaan adalah POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Metode tidak diizinkan', 'timestamp' => date('Y-m-d H:i:s')]);
    exit;
}

// Menerima input JSON dari body permintaan
$input = json_decode(file_get_contents('php://input'), true);

// Ekstrak tipe dan nilai dari input
$type = $input['type'] ?? '';   // Bisa 'npwp' atau 'nib'
$value = $input['value'] ?? ''; // Nilai NPWP atau NIB yang akan dicek

// Validasi dasar input
if (empty($type) || empty($value)) {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Tipe dan nilai data yang ingin dicek harus disediakan.', 'timestamp' => date('Y-m-d H:i:s')]);
    exit;
}

try {
    // Inisialisasi koneksi database
    $database = new Database();
    $db = $database->getConnection();

    $found = false; // Status apakah data ditemukan atau tidak
    $details = null; // Detail data jika ditemukan (opsional)

    // Logika pengecekan berdasarkan tipe
    if ($type === 'npwp') {
        // Gunakan NPWP ASLI (dengan format) untuk query
        $stmt = $db->prepare("SELECT id, company_name, nib, npwp FROM companies WHERE npwp = ? LIMIT 1");
        $stmt->execute([$value]); 
        $companyData = $stmt->fetch(PDO::FETCH_ASSOC); 

        if ($companyData) {
            $found = true;
            $details = [
                'id' => $companyData['id'],
                'company_name' => $companyData['company_name'],
                'nib' => $companyData['nib'],
                'npwp' => $companyData['npwp'],
            ];
        }
    } elseif ($type === 'nib') {
        // Selalu gunakan NIB yang DIBERSIHKAN (hanya angka) untuk query
        $cleanValue = cleanNib($value);
        $stmt = $db->prepare("SELECT id, company_name, npwp, nib FROM companies WHERE nib = ? LIMIT 1");
        $stmt->execute([$cleanValue]); 
        $companyData = $stmt->fetch(PDO::FETCH_ASSOC); 

        if ($companyData) {
            $found = true;
            $details = [
                'id' => $companyData['id'],
                'company_name' => $companyData['company_name'],
                'npwp' => $companyData['npwp'],
                'nib' => $companyData['nib'],
            ];
        }
    } else {
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Tipe pengecekan tidak valid.', 'timestamp' => date('Y-m-d H:i:s')]);
        exit;
    }

    // --- PERBAIKAN KRITIS: Kirim respons JSON secara manual ---
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(200); // Selalu 200 OK jika pengecekan berhasil dilakukan (baik ditemukan/tidak)
    echo json_encode([
        'status' => 'success',
        'message' => 'Pengecekan berhasil.',
        'timestamp' => date('Y-m-d H:i:s'),
        'found' => $found, // Sekarang 'found' ada langsung di root 'data' yang diterima frontend
        'type' => $type,
        'value' => $value, 
        'details' => $details 
    ], JSON_UNESCAPED_UNICODE);
    exit;
    // --- AKHIR PERBAIKAN KRITIS ---

} catch (PDOException $e) {
    // Tangani error database
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Terjadi kesalahan database saat melakukan pengecekan: ' . $e->getMessage(), 'timestamp' => date('Y-m-d H:i:s')]);
    exit;
} catch (Exception $e) {
    // Tangani error umum lainnya
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal melakukan pengecekan: ' . $e->getMessage(), 'timestamp' => date('Y-m-d H:i:s')]);
    exit;
}
