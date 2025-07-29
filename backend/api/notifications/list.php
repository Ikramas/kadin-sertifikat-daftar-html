<?php
// File: backend/api/notifications/list.php
require_once __DIR__ . '/../../error_handler.php';
require_once __DIR__ . '/../../classes/ApiResponse.php';
require_once __DIR__ . '/../../classes/JWT.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../classes/ErrorLogger.php';

// header('Content-Type: application/json'); // Sudah ditangani oleh config/cors.php

try {
    // Verify JWT token
    $currentUser = JWT::requireAuth(); // Memastikan pengguna terautentikasi dan mendapatkan data user

    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Default limit
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    if ($limit > 100 || $limit < 1) { // Batasi limit agar tidak terlalu besar
        $limit = 50;
    }

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
              LIMIT :limit";
              
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $currentUser['user_id']);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT); // Bind param sebagai integer
    $stmt->execute();
    
    $notifications = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { // Fetch as associative array
        $notifications[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'message' => $row['message'],
            'type' => $row['type'],
            'timestamp' => $row['timestamp'],
            'read' => (bool)$row['read'], // Pastikan ini adalah boolean
            'actionUrl' => $row['action_url']
        ];
    }
    
    logApiRequest('GET', 'notifications/list', ['user_id' => $currentUser['user_id'], 'limit' => $limit], 'success');
    
    ApiResponse::success(['notifications' => $notifications], 'Notifications retrieved successfully');

} catch (Exception $e) {
    ErrorLogger::logSystemError('notifications_list_fetch', $e->getMessage(), [
        'user_id' => $currentUser['user_id'] ?? 'N/A',
        'file' => __FILE__,
        'line' => __LINE__
    ]);
    logApiRequest('GET', 'notifications/list', ['user_id' => $currentUser['user_id'] ?? 'N/A'], $e->getMessage());
    ApiResponse::serverError('Failed to retrieve notifications', 500);
}