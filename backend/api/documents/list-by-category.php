<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';

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
    $documents = $stmt->fetchAll();
    
    // Membersihkan path file agar bisa diakses dari web
    foreach ($documents as &$doc) {
        // Mengubah path absolut server (C:\xampp\...) menjadi path relatif web (/backend/uploads/...)
        $doc['file_path'] = str_replace('\\', '/', str_replace(realpath($_SERVER['DOCUMENT_ROOT']), '', realpath($doc['file_path'])));
    }
    
    ApiResponse::success(['documents' => $documents], 'Dokumen berhasil dimuat');
    
} catch (Exception $e) {
    ApiResponse::serverError('Gagal memuat dokumen: ' . $e->getMessage());
}