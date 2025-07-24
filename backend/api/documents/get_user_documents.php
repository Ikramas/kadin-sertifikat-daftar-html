// /backend/api/documents/get_user_documents.php

<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';

// Hanya izinkan metode GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Memerlukan autentikasi JWT
    $currentUser = JWT::requireAuth();

    $database = new Database();
    $db = $database->getConnection();

    // Ambil semua dokumen milik pengguna yang terautentikasi
    $stmt = $db->prepare("
        SELECT id, original_name, document_type, status, uploaded_at 
        FROM documents 
        WHERE user_id = ? 
        ORDER BY uploaded_at DESC
    ");
    $stmt->execute([$currentUser['user_id']]);
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    ApiResponse::success($documents, 'Dokumen berhasil diambil.');

} catch (Exception $e) {
    ApiResponse::serverError('Gagal mengambil dokumen: ' . $e->getMessage());
}