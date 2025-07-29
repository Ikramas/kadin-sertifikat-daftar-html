<?php
// File: backend/api/documents/get_user_documents.php

require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; // Pastikan ErrorLogger dimuat

// Hanya izinkan metode GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Memerlukan autentikasi JWT
    $currentUser = JWT::requireAuth();

    $database = new Database();
    $db = $database->getConnection();

    // Ambil semua dokumen milik pengguna yang terautentikasi, termasuk file_name
    $stmt = $db->prepare("
        SELECT id, original_name, file_name, document_type, status, uploaded_at 
        FROM documents 
        WHERE user_id = ? 
        ORDER BY uploaded_at DESC
    ");
    $stmt->execute([$currentUser['user_id']]);
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC); // Fetch as associative array

    // Tambahkan file_url untuk setiap dokumen
    foreach ($documents as &$doc) {
        if (!empty($doc['file_name'])) {
            $doc['file_url'] = '/backend/api/documents/download.php?file_name=' . urlencode($doc['file_name']);
        } else {
            $doc['file_url'] = null; // Jika file_name kosong, tidak bisa download
        }
        $doc['uploaded_at_formatted'] = $doc['uploaded_at'] ? date('d M Y H:i', strtotime($doc['uploaded_at'])) : null;
    }

    logApiRequest('GET', '/api/documents/get_user_documents', ['user_id' => $currentUser['user_id']], 'success');
    ApiResponse::success(['documents' => $documents], 'Dokumen berhasil diambil.');

} catch (Exception $e) {
    ErrorLogger::logSystemError('get_user_documents_fetch', $e->getMessage(), ['user_id' => $currentUser['user_id'] ?? 'N/A']);
    logApiRequest('GET', '/api/documents/get_user_documents', ['user_id' => $currentUser['user_id'] ?? 'N/A'], $e->getMessage());
    ApiResponse::serverError('Gagal mengambil dokumen: ' . $e->getMessage());
}