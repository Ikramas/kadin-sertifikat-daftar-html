<?php
// File: backend/api/documents/upload.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/JWT.php';

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
        ApiResponse::error('File dokumen wajib diunggah');
    }
    
    $file = $_FILES['document'];
    $documentType = $_POST['document_type'] ?? '';
    // Menerima kategori dari frontend (default ke 'initial_registration' jika tidak disediakan)
    $category = $_POST['category'] ?? 'initial_registration'; 
    
    // Memvalidasi tipe dokumen yang diizinkan
    $allowedTypes = [
        'kta_kadin_terakhir', 
        'nib', 
        'akta_pendirian', 
        'akta_perubahan', 
        'npwp_perusahaan', 
        'sk_kemenkumham', 
        'ktp_pimpinan', 
        'npwp_pimpinan', 
        'pasfoto_pimpinan', 
        'neraca_tahun_terakhir',       // Tipe dokumen baru (Neraca SBU)
        'surat_permohonan_subbidang',  // Tipe dokumen baru (Surat Permohonan SBU)
        'sbu_certificate',             // Jika ada upload sertifikat SBU yang sudah jadi
        'other'
    ];
    
    if (!in_array($documentType, $allowedTypes)) {
        ApiResponse::error('Tipe dokumen tidak valid: ' . htmlspecialchars($documentType)); 
    }
    
    // Memvalidasi file yang diunggah (ukuran, tipe MIME)
    try {
        SecurityManager::validateFileUpload($file); 
    } catch (Exception $e) {
        ApiResponse::error($e->getMessage());
    }
    
    // Koneksi ke database
    $database = new Database();
    $db = $database->getConnection();
    
    // Membuat direktori unggahan jika belum ada
    $uploadDir = __DIR__ . '/../../uploads/documents/';
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
        // Log detail kegagalan move_uploaded_file jika perlu
        error_log("Failed to move uploaded file. From: " . $file['tmp_name'] . " To: " . $filePath . " Error code: " . $file['error']);
        ApiResponse::serverError('Gagal menyimpan file.');
    }
    
    // Memasukkan catatan dokumen ke database
    $stmt = $db->prepare("
        INSERT INTO documents (
            user_id, original_name, file_name, file_path, file_size, mime_type,
            document_type, category, status, uploaded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'uploaded', NOW())
    ");
    
    $stmt->execute([
        $currentUser['user_id'],
        $file['name'], 
        $fileName,     
        $filePath,
        $file['size'],
        $file['type'],
        $documentType, 
        $category      
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
    
    logApiRequest('POST', '/api/documents/upload', [
        'user_id' => $currentUser['user_id'],
        'document_type' => $documentType,
        'file_size' => $file['size']
    ], ['success' => true, 'document_id' => $documentId]);
    
    ApiResponse::success([
        'document' => $documentInfo,
        'csrf_token' => CSRFProtection::generateToken() 
    ], 'Dokumen berhasil diunggah');
    
} catch (Exception $e) {
    // Membersihkan file jika unggahan berhasil tetapi insert database gagal
    if (isset($filePath) && file_exists($filePath)) {
        unlink($filePath);
    }
    
    logApiRequest('POST', '/api/documents/upload', [
        'user_id' => $currentUser['user_id'] ?? null,
        'document_type' => $documentType ?? null
    ], $e->getMessage());
    
    ApiResponse::serverError('Gagal mengunggah dokumen: ' . $e->getMessage());
}