<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
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
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid');
    }
    
    // Sanitize input
    $input = SecurityManager::sanitizeInput($input);
    
    // Extract data
    $applicationId = $input['application_id'] ?? '';
    
    // Validate input
    $validator = new Validator();
    $validator->required('application_id', $applicationId, 'ID permohonan wajib diisi');
    $validator->validate();
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Get application
    $stmt = $db->prepare("
        SELECT a.*, c.company_name 
        FROM applications a
        LEFT JOIN companies c ON a.company_id = c.id
        WHERE a.id = ? AND a.user_id = ?
    ");
    $stmt->execute([$applicationId, $currentUser['user_id']]);
    $application = $stmt->fetch();
    
    if (!$application) {
        ApiResponse::notFound('Permohonan tidak ditemukan');
    }
    
    if ($application['status'] !== 'draft') {
        ApiResponse::error('Permohonan sudah disubmit atau tidak dapat diubah');
    }
    
    // Check required documents based on application type
    $requiredDocs = [];
    switch ($application['application_type']) {
        case 'new':
            $requiredDocs = ['akta_pendirian', 'npwp_perusahaan', 'nib', 'kta_kadin_terakhir'];
            break;
        case 'renewal':
            $requiredDocs = ['sbu_certificate', 'kta_kadin_terakhir'];
            break;
        case 'upgrade':
            $requiredDocs = ['sbu_certificate', 'akta_perubahan', 'kta_kadin_terakhir'];
            break;
    }
    
    // Check uploaded documents
    $stmt = $db->prepare("
        SELECT document_type, COUNT(*) as count
        FROM documents 
        WHERE user_id = ? AND category = 'sbu_application' AND related_application_id = ?
        GROUP BY document_type
    ");
    $stmt->execute([$currentUser['user_id'], $applicationId]);
    $uploadedDocs = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $missingDocs = [];
    foreach ($requiredDocs as $reqDoc) {
        if (!isset($uploadedDocs[$reqDoc]) || $uploadedDocs[$reqDoc] == 0) {
            $missingDocs[] = $reqDoc;
        }
    }
    
    if (!empty($missingDocs)) {
        ApiResponse::validation([
            'documents' => 'Dokumen yang belum diunggah: ' . implode(', ', $missingDocs)
        ]);
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Update application status
        $stmt = $db->prepare("
            UPDATE applications 
            SET status = 'submitted', submission_date = NOW(), updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$applicationId]);
        
        // Create notification for admin
        $stmt = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id, created_at)
            SELECT id, 'Permohonan SBU Baru', 
                   CONCAT('Permohonan SBU baru dari ', ?, ' dengan nomor ', ?, ' telah disubmit untuk review'),
                   'info', 'application', ?, NOW()
            FROM users WHERE role IN ('admin', 'super_admin')
        ");
        $stmt->execute([$application['company_name'], $application['application_number'], $applicationId]);
        
        // Create notification for user
        $stmt = $db->prepare("
            INSERT INTO notifications (
                user_id, title, message, type, related_type, related_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $currentUser['user_id'],
            'Permohonan SBU Disubmit',
            "Permohonan SBU Anda dengan nomor {$application['application_number']} telah berhasil disubmit dan sedang menunggu review dari admin.",
            'success',
            'application',
            $applicationId
        ]);
        
        // Commit transaction
        $db->commit();
        
        logApiRequest('POST', '/api/applications/submit', [
            'user_id' => $currentUser['user_id'],
            'application_id' => $applicationId,
            'application_number' => $application['application_number']
        ], ['success' => true]);
        
        ApiResponse::success([
            'application_id' => $applicationId,
            'application_number' => $application['application_number'],
            'status' => 'submitted'
        ], 'Permohonan SBU berhasil disubmit! Tim admin akan melakukan review dalam 3-5 hari kerja. Anda akan mendapat notifikasi melalui email untuk update selanjutnya.');
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    logApiRequest('POST', '/api/applications/submit', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal submit permohonan: ' . $e->getMessage());
}