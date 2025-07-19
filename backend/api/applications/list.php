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
    // Require authentication
    $currentUser = JWT::requireAuth();
    
    // Connect to database
    $database = new Database();
    $db = $database->getConnection();
    
    // Get applications with company info
    $stmt = $db->prepare("
        SELECT 
            a.id, a.application_number, a.application_type, a.current_sbu_number,
            a.requested_classification, a.business_field, a.company_qualification,
            a.status, a.submission_date, a.review_date, a.completion_date,
            a.notes, a.created_at, a.updated_at,
            c.company_name,
            u.name as reviewer_name
        FROM applications a
        LEFT JOIN companies c ON a.company_id = c.id
        LEFT JOIN users u ON a.reviewer_id = u.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
    ");
    $stmt->execute([$currentUser['user_id']]);
    $applications = $stmt->fetchAll();
    
    // Get document count for each application
    foreach ($applications as &$application) {
        $stmt = $db->prepare("
            SELECT COUNT(*) as document_count
            FROM documents 
            WHERE user_id = ? AND category = 'sbu_application' AND related_application_id = ?
        ");
        $stmt->execute([$currentUser['user_id'], $application['id']]);
        $docCount = $stmt->fetch();
        $application['document_count'] = $docCount['document_count'] ?? 0;
        
        // Format dates
        $application['created_at_formatted'] = $application['created_at'] ? date('d/m/Y H:i', strtotime($application['created_at'])) : null;
        $application['submission_date_formatted'] = $application['submission_date'] ? date('d/m/Y H:i', strtotime($application['submission_date'])) : null;
        $application['review_date_formatted'] = $application['review_date'] ? date('d/m/Y H:i', strtotime($application['review_date'])) : null;
        $application['completion_date_formatted'] = $application['completion_date'] ? date('d/m/Y H:i', strtotime($application['completion_date'])) : null;
    }
    
    logApiRequest('GET', '/api/applications/list', ['user_id' => $currentUser['user_id']], ['success' => true, 'count' => count($applications)]);
    
    ApiResponse::success([
        'applications' => $applications,
        'total' => count($applications)
    ], 'Daftar permohonan berhasil dimuat');
    
} catch (Exception $e) {
    logApiRequest('GET', '/api/applications/list', ['user_id' => $currentUser['user_id'] ?? null], $e->getMessage());
    ApiResponse::serverError('Gagal memuat daftar permohonan: ' . $e->getMessage());
}