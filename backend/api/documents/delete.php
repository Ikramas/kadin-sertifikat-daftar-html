<?php
// File: backend/api/documents/delete.php
// Endpoint untuk menghapus dokumen yang diunggah oleh pengguna.

// Memuat file autoload Composer dan konfigurasi aplikasi
require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/app.php'; // Muat UPLOAD_DIR_BASE
require_once __DIR__ . '/../../classes/ApiResponse.php';
require_once __DIR__ . '/../../classes/JWT.php';
require_once __DIR__ . '/../../classes/SecurityManager.php'; 
require_once __DIR__ . '/../../classes/ErrorLogger.php';
require_once __DIR__ . '/../../classes/Validator.php'; 
require_once __DIR__ . '/../error_handler.php';

// Validasi metode request: harus DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Autentikasi dan otorisasi JWT
    $currentUser = JWT::requireAuth(); 
    // CSRFProtection::requireValidToken(); // Untuk DELETE request JSON body, CSRF token harus ada di header

    $database = new Database(); 
    $db = $database->getConnection();

    // Dapatkan ID dokumen dari body request JSON
    $input = json_decode(file_get_contents('php://input'), true);
    $documentId = $input['document_id'] ?? null;

    // Validasi input documentId
    $validator = new Validator();
    $validator->required('document_id', $documentId, 'ID dokumen wajib disediakan.');
    $validator->numeric('document_id', $documentId, 'ID dokumen harus berupa angka.');
    $validator->validate(); 

    // Ambil informasi dokumen dari database, termasuk file_name dan user_id pemilik
    $stmt = $db->prepare("SELECT id, file_name, file_path, user_id, original_name FROM documents WHERE id = ?");
    $stmt->execute([$documentId]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);

    // Periksa apakah dokumen ditemukan
    if (!$document) {
        ApiResponse::notFound('Dokumen tidak ditemukan atau sudah dihapus.');
    }

    // Pastikan user yang menghapus adalah pemilik dokumen
    if ($document['user_id'] != $currentUser['user_id']) {
        ErrorLogger::logSecurityEvent('unauthorized_document_delete', "User {$currentUser['user_id']} attempted to delete document {$documentId} owned by {$document['user_id']}.");
        ApiResponse::forbidden('Akses ditolak: Anda tidak memiliki izin untuk menghapus dokumen ini.');
    }

    // Tentukan path lengkap file fisik di server
    $uploadDir = DOCUMENTS_UPLOAD_DIR; // Menggunakan konstanta direktori
    $filePath = $uploadDir . basename($document['file_name']); 

    // Hapus record dokumen dari database terlebih dahulu (penting untuk konsistensi)
    $db->beginTransaction(); 
    try {
        $stmt = $db->prepare("DELETE FROM documents WHERE id = ? AND user_id = ?");
        $stmt->execute([$documentId, $currentUser['user_id']]);

        // Periksa apakah ada baris yang terpengaruh (artinya penghapusan berhasil)
        if ($stmt->rowCount() === 0) {
            $db->rollBack();
            ApiResponse::notFound('Dokumen tidak dapat dihapus dari database atau sudah tidak ada.');
        }

        // Hapus file fisik dari server jika ada
        if (file_exists($filePath)) {
            if (!unlink($filePath)) {
                // Jika gagal menghapus file fisik, log error dan lempar exception
                ErrorLogger::logSystemError('physical_file_delete_failed', "Failed to delete physical file: " . $filePath, ['document_id' => $documentId, 'user_id' => $currentUser['user_id']]);
                // Lemparkan exception agar transaksi di-rollback
                throw new Exception("Gagal menghapus file fisik dokumen. Mohon coba lagi.");
            } else {
                 ErrorLogger::logSystemError('physical_file_delete_success', "Physical file deleted: " . $filePath, ['document_id' => $documentId, 'user_id' => $currentUser['user_id']]);
            }
        } else {
            // File tidak ditemukan di sistem file. Ini bisa terjadi jika sudah dihapus secara manual
            // atau path di database salah. Log ini dan tetap lanjutkan penghapusan di DB.
            ErrorLogger::logSystemError('physical_file_not_found', "Physical file not found for document ID {$documentId} at path: " . $filePath, ['user_id' => $currentUser['user_id']]);
        }

        $db->commit();
        logApiRequest('DELETE', '/api/documents/delete', ['document_id' => $documentId, 'user_id' => $currentUser['user_id']], 'success');
        ApiResponse::success(null, 'Dokumen berhasil dihapus.');

    } catch (Exception $e) {
        $db->rollBack();
        ErrorLogger::logSystemError('document_delete_transaction_failed', $e->getMessage(), ['document_id' => $documentId ?? 'N/A', 'user_id' => $currentUser['user_id'] ?? 'N/A']);
        throw $e; // Lempar kembali exception untuk ditangkap oleh blok catch luar
    }

} catch (Exception $e) {
    ErrorLogger::logSystemError('document_delete_api_error', $e->getMessage(), ['document_id' => $documentId ?? 'N/A', 'user_id' => $currentUser['user_id'] ?? 'N/A']);
    ApiResponse::serverError('Gagal menghapus dokumen: ' . $e->getMessage());
}