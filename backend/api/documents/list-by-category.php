<?php
// File: backend/api/documents/list-by-category.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/app.php'; // Muat APP_BASE_URL
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; 

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Memastikan hanya pengguna yang sudah login yang bisa mengakses
    $currentUser = JWT::requireAuth();
    
    // Mengambil kategori dari URL (contoh: ?category=initial_registration)
    $category = $_GET['category'] ?? '';

    if (empty($category)) {
        ApiResponse::error('Kategori dokumen wajib diisi', 400);
    }

    // Validasi kategori yang diizinkan (dari daftar yang sudah terdefinisi)
    $allowedCategories = ['initial_registration', 'initial_registration_temp', 'sbu_application', 'sbu_application_temp', 'certificate'];
    if (!in_array($category, $allowedCategories)) {
        ApiResponse::error('Kategori dokumen tidak valid.', 400);
    }

    // Koneksi ke database
    $database = new Database();
    $db = $database->getConnection();
    
    // Mengambil daftar dokumen HANYA untuk user yang sedang login dan kategori yang diminta
    $stmt = $db->prepare("
        SELECT id, original_name, file_name, file_path, file_size, mime_type, document_type, status, uploaded_at
        FROM documents 
        WHERE user_id = ? AND category = ?
        ORDER BY uploaded_at DESC
    ");
    $stmt->execute([$currentUser['user_id'], $category]);
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC); // Fetch as associative array
    
    // Membersihkan path file agar bisa diakses dari web dan menambahkan file_url
    foreach ($documents as &$doc) {
        if (!empty($doc['file_name'])) {
            // Membentuk file_url yang benar untuk download
            $doc['file_url'] = '/backend/api/documents/download.php?file_name=' . urlencode($doc['file_name']);
        } else {
            $doc['file_url'] = null; // Tidak bisa download jika file_name kosong
            ErrorLogger::logSystemError('document_list_missing_filename', "Document ID {$doc['id']} has empty file_name for user {$currentUser['user_id']} in category {$category}.");
        }
        // Hapus file_path dari respons API agar tidak mengekspos struktur direktori server
        unset($doc['file_path']); 
    }
    
    logApiRequest('GET', '/api/documents/list-by-category', ['user_id' => $currentUser['user_id'], 'category' => $category], 'success');
    ApiResponse::success(['documents' => $documents], 'Dokumen berhasil dimuat');
    
} catch (Exception $e) {
    ErrorLogger::logSystemError('document_list_by_category_fetch', $e->getMessage(), ['user_id' => $currentUser['user_id'] ?? 'N/A', 'category' => $category ?? 'N/A']);
    logApiRequest('GET', '/api/documents/list-by-category', ['user_id' => $currentUser['user_id'] ?? 'N/A', 'category' => $category ?? 'N/A'], $e->getMessage());
    ApiResponse::serverError('Gagal memuat dokumen: ' . $e->getMessage());
}