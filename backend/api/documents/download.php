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
    $currentUser = JWT::requireAuth(); // Ini akan memverifikasi token JWT

    $database = new Database();
    $db = $database->getConnection();

    $file_name = isset($_GET['file_name']) ? $_GET['file_name'] : null;
    $document_id = isset($_GET['id']) ? $_GET['id'] : null; // Tambahkan ini jika Anda masih ingin mendukung ID

    if (!$file_name && !$document_id) {
        ApiResponse::error('Nama file atau ID dokumen tidak disediakan.', 400);
    }

    $stmt = null;
    $document = null;

    if ($file_name) {
        $stmt = $db->prepare("SELECT * FROM documents WHERE file_name = ? AND user_id = ?");
        $stmt->execute([$file_name, $currentUser['user_id']]);
        $document = $stmt->fetch(PDO::FETCH_ASSOC);
    } elseif ($document_id) {
        // Jika Anda masih ingin mendukung ID, pastikan juga memverifikasi user_id
        $stmt = $db->prepare("SELECT * FROM documents WHERE id = ? AND user_id = ?");
        $stmt->execute([$document_id, $currentUser['user_id']]);
        $document = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$document) {
        ApiResponse::notFound('Dokumen tidak ditemukan atau Anda tidak memiliki akses.');
    }

    $file_path = __DIR__ . '/../../uploads/documents/' . $document['file_name'];

    if (!file_exists($file_path)) {
        ApiResponse::notFound('File dokumen tidak ditemukan di server.');
    }

    // Set header untuk unduhan
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream'); // Mengatur tipe konten generik untuk unduhan
    header('Content-Disposition: attachment; filename="' . basename($document['original_name']) . '"'); // Menggunakan original_name
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($file_path));
    
    // Pastikan output buffering dimatikan untuk mencegah masalah unduhan
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    readfile($file_path);
    exit;

} catch (Exception $e) {
    // Log error untuk debugging
    error_log("Download Error: " . $e->getMessage() . " - User ID: " . ($currentUser['user_id'] ?? 'N/A') . " - File: " . ($file_name ?? $document_id ?? 'N/A'));
    ApiResponse::serverError('Gagal mengunduh dokumen: ' . $e->getMessage());
}