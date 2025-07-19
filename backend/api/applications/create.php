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
    
    // Check user status
    if (!in_array($currentUser['status'], ['active', 'verified'])) {
        ApiResponse::forbidden('Anda belum dapat mengajukan SBU. Silakan lengkapi dokumen registrasi terlebih dahulu.');
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid');
    }
    
    // Sanitize input
    $input = SecurityManager::sanitizeInput($input);
    
    // Extract data
    $applicationType = $input['application_type'] ?? '';
    $currentSbuNumber = $input['current_sbu_number'] ?? '';
    $requestedClassification = $input['requested_classification'] ?? '';
    $businessField = $input['business_field'] ?? '';
    $companyQualification = $input['company_qualification'] ?? '';
    $notes = $input['notes'] ?? '';
    $uploadedDocuments = $input['uploaded_documents'] ?? [];
    
    // Validate input
    $validator = new Validator();
    $validator
        ->required('application_type', $applicationType, 'Jenis permohonan wajib dipilih')
        ->custom('application_type', $applicationType, function($value) {
            return in_array($value, ['new', 'renewal', 'upgrade']);
        }, 'Jenis permohonan tidak valid')
        ->required('requested_classification', $requestedClassification, 'Klasifikasi yang diminta wajib diisi')
        ->required('business_field', $businessField, 'Bidang usaha wajib diisi')
        ->required('company_qualification', $companyQualification, 'Kualifikasi perusahaan wajib dipilih')
        ->custom('company_qualification', $companyQualification, function($value) {
            return in_array($value, ['Kecil', 'Menengah', 'Besar']);
        }, 'Kualifikasi perusahaan tidak valid');
    
    // Additional validation for renewal/upgrade
    if (in_array($applicationType, ['renewal', 'upgrade'])) {
        $validator->required('current_sbu_number', $currentSbuNumber, 'Nomor SBU saat ini wajib diisi untuk perpanjangan/upgrade');
    }
    
    $validator->validate();
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Get user's company
    $stmt = $db->prepare("SELECT id, status FROM companies WHERE user_id = ?");
    $stmt->execute([$currentUser['user_id']]);
    $company = $stmt->fetch();
    
    if (!$company || $company['status'] !== 'verified') {
        ApiResponse::error('Data perusahaan belum terverifikasi. Silakan hubungi administrator.');
    }
    
    // Generate application number
    $currentYear = date('Y');
    $stmt = $db->prepare("SELECT COUNT(*) FROM applications WHERE YEAR(created_at) = ?");
    $stmt->execute([$currentYear]);
    $count = $stmt->fetchColumn() + 1;
    $applicationNumber = 'SBU-' . $currentYear . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Insert application
        $stmt = $db->prepare("
            INSERT INTO applications (
                user_id, company_id, application_number, application_type, 
                current_sbu_number, requested_classification, business_field, 
                company_qualification, status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, NOW())
        ");
        $stmt->execute([
            $currentUser['user_id'], $company['id'], $applicationNumber, 
            $applicationType, $currentSbuNumber, $requestedClassification, 
            $businessField, $companyQualification, $notes
        ]);
        
        $applicationId = $db->lastInsertId();
        
        // Link uploaded documents to application
        if (!empty($uploadedDocuments)) {
            foreach ($uploadedDocuments as $documentId) {
                // Verify document exists and belongs to user
                $stmt = $db->prepare("SELECT id FROM documents WHERE id = ? AND user_id = ?");
                $stmt->execute([$documentId, $currentUser['user_id']]);
                
                if ($stmt->fetch()) {
                    $stmt = $db->prepare("
                        UPDATE documents SET 
                            category = 'sbu_application', 
                            related_application_id = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$applicationId, $documentId]);
                }
            }
        }
        
        // Create notification for user
        $stmt = $db->prepare("
            INSERT INTO notifications (
                user_id, title, message, type, related_type, related_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $currentUser['user_id'],
            'Permohonan SBU Dibuat',
            "Permohonan SBU Anda dengan nomor {$applicationNumber} telah dibuat dan dalam status draft. Silakan lengkapi dokumen yang diperlukan.",
            'info',
            'application',
            $applicationId
        ]);
        
        // Commit transaction
        $db->commit();
        
        logApiRequest('POST', '/api/applications/create', [
            'user_id' => $currentUser['user_id'],
            'application_type' => $applicationType,
            'application_number' => $applicationNumber
        ], ['success' => true, 'application_id' => $applicationId]);
        
        ApiResponse::success([
            'application_id' => $applicationId,
            'application_number' => $applicationNumber,
            'status' => 'draft'
        ], 'Permohonan SBU berhasil dibuat. Silakan lengkapi dokumen yang diperlukan dan submit permohonan.');
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    logApiRequest('POST', '/api/applications/create', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal membuat permohonan SBU: ' . $e->getMessage());
}