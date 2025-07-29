<?php
// File: backend/api/documents/download.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/app.php'; // Muat UPLOAD_DIR_BASE
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; 

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Autentikasi pengguna
    $currentUser = JWT::requireAuth(); 

    $database = new Database();
    $db = $database->getConnection();

    $file_name = $_GET['file_name'] ?? null;

    if (empty($file_name)) { 
        ApiResponse::error('Nama file dokumen tidak disediakan.', 400); 
    }

    // Sanitize file_name untuk mencegah directory traversal
    $file_name_sanitized = basename($file_name);
    
    // Ambil dokumen berdasarkan file_name DAN user_id untuk memastikan otorisasi
    $stmt = $db->prepare("SELECT original_name, file_name, file_path, mime_type, file_size, document_type FROM documents WHERE file_name = ? AND user_id = ?");
    $stmt->execute([$file_name_sanitized, $currentUser['user_id']]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$document) {
        ErrorLogger::logSecurityEvent('document_download_unauthorized', "Attempt to download non-existent or unauthorized document.", ['user_id' => $currentUser['user_id'], 'file_name_requested' => $file_name, 'file_name_sanitized' => $file_name_sanitized]);
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
        // Hapus karakter non-alphanumeric (kecuali spasi), lalu ganti spasi dengan underscore
        $company_name_formatted = preg_replace('/[^a-zA-Z0-9\s]/', '', $company_name_raw); 
        $company_name_formatted = str_replace(' ', '_', $company_name_formatted); 
        $company_name_formatted = trim($company_name_formatted, '_'); // Hapus underscore di awal/akhir
    }
    
    // 2. Format tipe dokumen: ganti underscore dengan spasi dan kapitalisasi setiap kata
    $document_type_humanized = str_replace('_', ' ', $document['document_type']);
    $document_type_humanized = ucwords($document_type_humanized);
    
    // Menghilangkan karakter non-alphanumeric dari document_type_humanized untuk nama file
    $document_type_clean = preg_replace('/[^a-zA-Z0-9\s]/', '', $document_type_humanized);
    $document_type_clean = str_replace(' ', '_', $document_type_clean);
    $document_type_clean = trim($document_type_clean, '_');

    // Dapatkan ekstensi file dari original_name
    $fileExtension = pathinfo($document['original_name'], PATHINFO_EXTENSION);
    if (empty($fileExtension)) {
        // Fallback jika original_name tidak memiliki ekstensi
        $fileExtension = pathinfo($document['file_name'], PATHINFO_EXTENSION);
    }
    $fileExtension = strtolower($fileExtension); 

    // Gabungkan untuk nama file unduhan akhir
    $download_filename_parts = [];
    if (!empty($document_type_clean)) {
        $download_filename_parts[] = $document_type_clean;
    }
    
    if (!empty($company_name_formatted)) {
        $download_filename_parts[] = $company_name_formatted;
    }
    
    // Jika tidak ada bagian yang diformat, gunakan original_name sebagai fallback
    if (empty($download_filename_parts)) {
        $download_filename = basename($document['original_name']); 
    } else {
        $download_filename = implode('_', $download_filename_parts);
        // Tambahkan ekstensi file
        if (!empty($fileExtension)) {
            $download_filename .= '.' . $fileExtension;
        }
    }
    
    // Pastikan nama file tidak terlalu panjang atau mengandung karakter aneh
    $download_filename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $download_filename);
    $download_filename = preg_replace('/__+/', '_', $download_filename); 
    $download_filename = trim($download_filename, '_-');

    // Jika nama file masih kosong setelah sanitasi, fallback ke default generik
    if (empty($download_filename)) {
        $download_filename = 'document_download.' . ($fileExtension ?: 'bin');
    }

    // ---------------------------------------------------------------------------------

    // Gunakan konstanta direktori dari config/app.php
    $file_path_on_server = DOCUMENTS_UPLOAD_DIR . $document['file_name'];

    if (!file_exists($file_path_on_server)) {
        ErrorLogger::logSystemError('document_file_not_found', "Physical file not found on server for download.", ['user_id' => $currentUser['user_id'], 'file_name' => $file_name, 'path_on_server' => $file_path_on_server]);
        ApiResponse::notFound('File dokumen tidak ditemukan di server.');
    }

    // Set header untuk unduhan
    header('Content-Description: File Transfer');
    header('Content-Type: ' . ($document['mime_type'] ?? 'application/octet-stream')); 
    header('Content-Disposition: attachment; filename="' . $download_filename . '"'); 
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($file_path_on_server));
    
    // Clear any previous output buffers to prevent corruption
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    readfile($file_path_on_server);
    exit;

} catch (Exception $e) {
    ErrorLogger::logSystemError('document_download_error', $e->getMessage(), ['user_id' => $currentUser['user_id'] ?? 'N/A', 'file_requested' => $file_name ?? 'N/A']);
    logApiRequest('GET', '/api/documents/download', ['file_name' => $file_name ?? 'N/A'], $e->getMessage());
    ApiResponse::serverError('Gagal mengunduh dokumen: ' . $e->getMessage());
}