<?php
// File: backend/api/documents/upload.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/app.php'; // Muat APP_BASE_URL dan UPLOAD_DIR_BASE
require_once '../../classes/ApiResponse.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; 

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Memerlukan autentikasi pengguna
    $currentUser = JWT::requireAuth();
    
    // Memvalidasi token CSRF
    CSRFProtection::requireValidToken();
    
    // Memeriksa apakah file diunggah. Pastikan nama input file di frontend adalah 'document'.
    if (!isset($_FILES['document']) || empty($_FILES['document']['name'])) {
        ApiResponse::error('File dokumen wajib diunggah', 400); 
    }
    
    $file = $_FILES['document'];
    $documentType = $_POST['document_type'] ?? '';
    // Menerima kategori dari frontend (default ke 'initial_registration' jika tidak disediakan)
    $category = $_POST['category'] ?? 'initial_registration'; 
    $relatedApplicationId = $_POST['related_application_id'] ?? null; // Untuk dokumen SBU

    // Memvalidasi tipe dokumen yang diizinkan (dari frontend)
    // Sesuaikan daftar ini dengan tipe dokumen yang valid di sistem Anda
    $allowedDocumentTypes = [
        'kta_kadin_terakhir', 'nib', 'akta_pendirian', 'akta_perubahan', 
        'npwp_perusahaan', 'sk_kemenkumham', 'ktp_pimpinan', 'npwp_pimpinan', 'pasfoto_pimpinan', 
        'neraca_tahun_terakhir', 'surat_permohonan_subbidang', 'laporan_laba_rugi', 'rekening_koran',
        'sbu_certificate', 'other' // 'other' untuk dokumen yang tidak masuk kategori spesifik
    ];
    
    if (!in_array($documentType, $allowedDocumentTypes)) {
        ApiResponse::error('Tipe dokumen tidak valid: ' . htmlspecialchars($documentType), 400); 
    }

    // Memvalidasi kategori yang diizinkan
    $allowedCategories = ['initial_registration', 'initial_registration_temp', 'sbu_application', 'sbu_application_temp', 'certificate'];
    if (!in_array($category, $allowedCategories)) {
        ApiResponse::error('Kategori dokumen tidak valid: ' . htmlspecialchars($category), 400);
    }

    // Koneksi ke database
    $database = new Database();
    $db = $database->getConnection();

    // Memulai transaksi database
    $db->beginTransaction();
    try {
        // Jika dokumen ini terkait dengan aplikasi SBU, cek otorisasi dan validasi aplikasi
        if (($category === 'sbu_application' || $category === 'sbu_application_temp') && !empty($relatedApplicationId)) {
            $stmtApp = $db->prepare("SELECT id FROM applications WHERE id = ? AND user_id = ?");
            $stmtApp->execute([$relatedApplicationId, $currentUser['user_id']]);
            if (!$stmtApp->fetch()) {
                throw new Exception("ID Aplikasi terkait tidak ditemukan atau Anda tidak memiliki akses.");
            }
        }

        // Memvalidasi file yang diunggah (ukuran, tipe MIME)
        SecurityManager::validateFileUpload($file); 
        
        // Menggunakan konstanta direktori dari config/app.php
        $uploadDir = DOCUMENTS_UPLOAD_DIR;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Menghasilkan nama file unik yang bersih untuk server
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $cleanDocumentType = preg_replace('/[^a-z0-9_]/i', '', $documentType); 
        // Format: doc_<user_id>_<document_type>_<unique_id>.<ext>
        $fileName = 'doc_' . $currentUser['user_id'] . '_' . $cleanDocumentType . '_' . uniqid('', true) . '.' . $fileExtension;
        
        $filePath = $uploadDir . $fileName;
        
        // Memindahkan file yang diunggah ke lokasi penyimpanan
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            ErrorLogger::logSystemError('file_upload_move_failed', 'Failed to move uploaded file.', [
                'from' => $file['tmp_name'], 
                'to' => $filePath, 
                'error_code' => $file['error'], 
                'user_id' => $currentUser['user_id']
            ]);
            throw new Exception('Gagal menyimpan file.');
        }
        
        // Hapus dokumen lama dengan tipe yang sama untuk user yang sama dan kategori yang sama
        // Agar tidak ada duplikasi dokumen untuk tipe yang sama
        $stmtDeleteOld = $db->prepare("SELECT id, file_name FROM documents WHERE user_id = ? AND document_type = ? AND category = ?");
        $stmtDeleteOld->execute([$currentUser['user_id'], $documentType, $category]);
        $oldDocument = $stmtDeleteOld->fetch(PDO::FETCH_ASSOC);

        if ($oldDocument) {
            $oldFilePath = $uploadDir . basename($oldDocument['file_name']);
            if (file_exists($oldFilePath) && unlink($oldFilePath)) {
                ErrorLogger::logSystemError('file_upload_replace_old', 'Successfully deleted old file upon new upload.', ['old_file_id' => $oldDocument['id'], 'old_file_name' => $oldDocument['file_name'], 'user_id' => $currentUser['user_id']]);
            } else {
                 ErrorLogger::logSystemError('file_upload_replace_old_failed', 'Failed to delete old file upon new upload.', ['old_file_id' => $oldDocument['id'], 'old_file_name' => $oldDocument['file_name'], 'user_id' => $currentUser['user_id'], 'path_checked' => $oldFilePath]);
            }
            $stmtDeleteOldRecord = $db->prepare("DELETE FROM documents WHERE id = ? AND user_id = ? AND document_type = ? AND category = ?");
            $stmtDeleteOldRecord->execute([$oldDocument['id'], $currentUser['user_id'], $documentType, $category]);
        }


        // Memasukkan catatan dokumen ke database
        $stmt = $db->prepare("
            INSERT INTO documents (
                user_id, original_name, file_name, file_path, file_size, mime_type,
                document_type, category, related_application_id, status, uploaded_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'uploaded', NOW())
        ");
        
        $stmt->execute([
            $currentUser['user_id'],
            $file['name'], 
            $fileName,     
            $filePath, // Menyimpan path internal server
            $file['size'],
            $file['type'],
            $documentType, 
            $category,
            $relatedApplicationId, // ID Aplikasi terkait (bisa null)
        ]);
        
        $documentId = $db->lastInsertId();
        
        // Mengambil informasi dokumen untuk respons API
        $stmt = $db->prepare("
            SELECT id, original_name, file_name, file_size, document_type, category, status, uploaded_at
            FROM documents 
            WHERE id = ?
        ");
        $stmt->execute([$documentId]);
        $documentInfo = $stmt->fetch(PDO::FETCH_ASSOC); 

        // Menambahkan file_url yang menunjuk ke endpoint unduhan terproteksi
        $documentInfo['file_url'] = '/backend/api/documents/download.php?file_name=' . urlencode($documentInfo['file_name']);
        
        $db->commit();

        logApiRequest('POST', '/api/documents/upload', [
            'user_id' => $currentUser['user_id'],
            'document_type' => $documentType,
            'file_size' => $file['size'],
            'category' => $category
        ], 'success');
        
        ApiResponse::success([
            'document' => $documentInfo,
            'csrf_token' => CSRFProtection::generateToken() 
        ], 'Dokumen berhasil diunggah');
        
    } catch (Exception $e) {
        $db->rollBack(); 

        // Membersihkan file yang diunggah jika ada error setelah move_uploaded_file
        if (isset($filePath) && file_exists($filePath)) {
            unlink($filePath);
            ErrorLogger::logSystemError('document_upload_temp_file_cleaned', 'Temporary uploaded file cleaned after error.', ['path' => $filePath]);
        }
        
        ErrorLogger::logSystemError('document_upload_failed', $e->getMessage(), [
            'user_id' => $currentUser['user_id'] ?? null,
            'document_type' => $documentType ?? null,
            'category' => $category ?? null,
            'file_name' => $file['name'] ?? 'N/A'
        ]);
        logApiRequest('POST', '/api/documents/upload', [
            'user_id' => $currentUser['user_id'] ?? null,
            'document_type' => $documentType ?? null
        ], $e->getMessage());
        
        ApiResponse::serverError('Gagal mengunggah dokumen: ' . $e->getMessage());
    }
} catch (Exception $e) {
    ErrorLogger::logSystemError('document_upload_validation_failed', $e->getMessage(), ['input' => $_POST ?? null, 'file_info' => $_FILES ?? null]);
    logApiRequest('POST', '/api/documents/upload', $_POST ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal mengunggah dokumen: ' . $e->getMessage());
}