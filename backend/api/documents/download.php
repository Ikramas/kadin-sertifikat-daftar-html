<?php
// File: backend/api/documents/download.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Autentikasi pengguna
    $currentUser = JWT::requireAuth(); 

    $database = new Database();
    $db = $database->getConnection();

    $file_name = isset($_GET['file_name']) ? $_GET['file_name'] : null;

    if (!$file_name) {
        ApiResponse::error('Nama file dokumen tidak disediakan.', 400); 
    }

    $stmt = null;
    $document = null;

    // Ambil dokumen berdasarkan file_name DAN user_id untuk memastikan otorisasi
    // Kita juga perlu document_type untuk nama unduhan
    $stmt = $db->prepare("SELECT original_name, file_name, file_path, mime_type, file_size, document_type FROM documents WHERE file_name = ? AND user_id = ?");
    $stmt->execute([$file_name, $currentUser['user_id']]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$document) {
        ApiResponse::notFound('Dokumen tidak ditemukan atau Anda tidak memiliki akses.');
    }

    // Ambil nama perusahaan untuk nama unduhan
    $stmt_company = $db->prepare("SELECT company_name FROM companies WHERE user_id = ?");
    $stmt_company->execute([$currentUser['user_id']]);
    $company_name_raw = $stmt_company->fetchColumn();

    // ---------------- PERBAIKAN DI SINI: FORMAT NAMA FILE SAAT DIUNDUH ----------------
    // 1. Format nama perusahaan: ganti spasi/karakter khusus dengan underscore
    $company_name_formatted = '';
    if (!empty($company_name_raw)) {
        $company_name_formatted = preg_replace('/[^a-zA-Z0-9\s]/', '', $company_name_raw); // Hapus karakter non-alphanumeric/spasi
        $company_name_formatted = str_replace(' ', '_', $company_name_formatted); // Ganti spasi dengan underscore
    }
    
    // 2. Format tipe dokumen: ganti underscore dengan spasi dan kapitalisasi setiap kata
    $document_type_humanized = str_replace('_', ' ', $document['document_type']);
    $document_type_humanized = ucwords($document_type_humanized);
    
    // Menghilangkan karakter non-alphanumeric dari document_type_humanized untuk nama file
    $document_type_clean = preg_replace('/[^a-zA-Z0-9\s]/', '', $document_type_humanized);
    $document_type_clean = str_replace(' ', '_', $document_type_clean);

    // Dapatkan ekstensi file dari original_name
    $fileExtension = pathinfo($document['original_name'], PATHINFO_EXTENSION);
    if (empty($fileExtension)) {
        // Fallback jika original_name tidak memiliki ekstensi
        $fileExtension = pathinfo($document['file_name'], PATHINFO_EXTENSION);
    }
    $fileExtension = strtolower($fileExtension); // Pastikan lowercase

    // Gabungkan untuk nama file unduhan akhir
    $download_filename = '';
    if (!empty($document_type_clean)) {
        $download_filename .= $document_type_clean;
    }
    
    if (!empty($company_name_formatted)) {
        if (!empty($download_filename)) {
            $download_filename .= '_'; // Tambahkan separator jika keduanya ada
        }
        $download_filename .= $company_name_formatted;
    }
    
    // Fallback jika nama yang diformat kosong (misal company_name atau document_type_clean kosong)
    if (empty($download_filename)) {
        // Gunakan original_name dari database sebagai fallback terakhir
        $download_filename = basename($document['original_name']); 
    } else {
        // Tambahkan ekstensi file
        $download_filename .= '.' . $fileExtension;
    }

    // ---------------------------------------------------------------------------------

    $actual_file_name_on_disk = $document['file_name']; 
    $file_path = __DIR__ . '/../../uploads/documents/' . $actual_file_name_on_disk;

    if (!file_exists($file_path)) {
        ApiResponse::notFound('File dokumen tidak ditemukan di server.');
    }

    // Set header untuk unduhan
    header('Content-Description: File Transfer');
    header('Content-Type: ' . ($document['mime_type'] ?? 'application/octet-stream')); 
    header('Content-Disposition: attachment; filename="' . $download_filename . '"'); // Gunakan nama file yang sudah diformat
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($file_path));
    
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    readfile($file_path);
    exit;

} catch (Exception $e) {
    error_log("Download Error: " . $e->getMessage() . " - User ID: " . ($currentUser['user_id'] ?? 'N/A') . " - File Requested: " . ($file_name ?? 'N/A'));
    ApiResponse::serverError('Gagal mengunduh dokumen: ' . $e->getMessage());
}