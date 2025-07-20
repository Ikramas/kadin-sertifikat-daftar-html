<?php
require_once __DIR__ . '/../../error_handler.php';
require_once __DIR__ . '/../../classes/ApiResponse.php';
require_once __DIR__ . '/../../classes/JWT.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../classes/ErrorLogger.php';

header('Content-Type: application/json');

try {
    // Verify JWT token
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';
    
    if (!$token || !str_starts_with($token, 'Bearer ')) {
        ApiResponse::error('Missing or invalid authorization token', 401);
    }
    
    $jwt = str_replace('Bearer ', '', $token);
    $decoded = JWT::decode($jwt);
    $userId = $decoded['user_id'];
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get notifications for user
    $query = "SELECT 
                id,
                title,
                message,
                type,
                created_at as timestamp,
                is_read as read,
                action_url
              FROM notifications 
              WHERE user_id = :user_id 
              ORDER BY created_at DESC 
              LIMIT 50";
              
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    $notifications = [];
    while ($row = $stmt->fetch()) {
        $notifications[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'message' => $row['message'],
            'type' => $row['type'],
            'timestamp' => $row['timestamp'],
            'read' => (bool)$row['read'],
            'actionUrl' => $row['action_url']
        ];
    }
    
    logApiRequest('GET', 'notifications/list', null, 'success', $userId);
    
    ApiResponse::success('Notifications retrieved successfully', [
        'notifications' => $notifications
    ]);

} catch (Exception $e) {
    ErrorLogger::logSystemError('notifications_list', $e->getMessage(), [
        'file' => __FILE__,
        'line' => __LINE__
    ]);
    
    ApiResponse::error('Failed to retrieve notifications', 500);
}