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
    // Require authentication
    $currentUser = JWT::requireAuth();
    
    // Validate CSRF token
    CSRFProtection::requireValidToken();
    
    // Check if file was uploaded
    if (!isset($_FILES['document']) || empty($_FILES['document']['name'])) {
        ApiResponse::error('File dokumen wajib diunggah');
    }
    
    $file = $_FILES['document'];
    $documentType = $_POST['document_type'] ?? '';
    $category = $_POST['category'] ?? 'initial_registration';
    
    // Validate document type
    $allowedTypes = [
        'kta_kadin_terakhir', 'nib', 'akta_pendirian', 'akta_perubahan',
        'npwp_perusahaan', 'sk_kemenkumham', 'ktp_pimpinan',
        'npwp_pimpinan', 'pasfoto_pimpinan', 'other'
    ];
    
    if (!in_array($documentType, $allowedTypes)) {
        ApiResponse::error('Tipe dokumen tidak valid');
    }
    
    // Validate file
    try {
        SecurityManager::validateFileUpload($file);
    } catch (Exception $e) {
        ApiResponse::error($e->getMessage());
    }
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Create upload directory if not exists
    $uploadDir = __DIR__ . '/../../uploads/documents/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Generate unique filename
    $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $fileName = 'doc_' . $currentUser['user_id'] . '_' . time() . '_' . bin2hex(random_bytes(8)) . '.' . $fileExtension;
    $filePath = $uploadDir . $fileName;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        ApiResponse::serverError('Gagal menyimpan file');
    }
    
    // Insert document record
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
    
    // Get document info for response
    $stmt = $db->prepare("
        SELECT id, original_name, file_name, file_size, document_type, category, status, uploaded_at
        FROM documents 
        WHERE id = ?
    ");
    $stmt->execute([$documentId]);
    $documentInfo = $stmt->fetch();

    // Tambahkan file_url yang menunjuk ke endpoint download terproteksi
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
    // Clean up file if it was uploaded but database insert failed
    if (isset($filePath) && file_exists($filePath)) {
        unlink($filePath);
    }
    
    logApiRequest('POST', '/api/documents/upload', [
        'user_id' => $currentUser['user_id'] ?? null,
        'document_type' => $documentType ?? null
    ], $e->getMessage());
    
    ApiResponse::serverError('Gagal mengunggah dokumen: ' . $e->getMessage());
}