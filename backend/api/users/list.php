<?php
// File: backend/api/users/list.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; // Pastikan ErrorLogger dimuat

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Memastikan Admin yang mengakses
    $adminUser = JWT::requireAuth();
    if ($adminUser['role'] !== 'admin' && $adminUser['role'] !== 'super_admin') {
        ApiResponse::forbidden('Hanya administrator yang dapat melihat daftar pengguna.');
    }

    $database = new Database();
    $db = $database->getConnection();

    $stmt = $db->prepare("SELECT id, uuid, name, email, phone, status, role, created_at, updated_at FROM users ORDER BY created_at DESC");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format tanggal untuk tampilan frontend
    foreach ($users as &$user) {
        $user['created_at_formatted'] = date('d M Y H:i', strtotime($user['created_at']));
        $user['updated_at_formatted'] = date('d M Y H:i', strtotime($user['updated_at']));
    }

    logApiRequest('GET', '/api/users/list', null, ['success' => true, 'total_users' => count($users)], $adminUser['user_id']);
    ApiResponse::success(['users' => $users, 'total' => count($users)], 'Daftar pengguna berhasil dimuat.');

} catch (Exception $e) {
    ErrorLogger::logSystemError('admin_user_list_error', $e->getMessage(), ['admin_id' => $adminUser['user_id'] ?? 'N/A']);
    logApiRequest('GET', '/api/users/list', null, $e->getMessage(), $adminUser['user_id'] ?? 'N/A');
    ApiResponse::serverError('Gagal memuat daftar pengguna: ' . $e->getMessage());
}