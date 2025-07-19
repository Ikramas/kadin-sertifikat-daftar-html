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
    $currentUser = JWT::requireAuth();
    $userId = $currentUser['user_id'];

    $database = new Database();
    $db = $database->getConnection();

    // Ambil pengaturan user, jika tidak ada, buat defaultnya
    $stmt = $db->prepare("SELECT * FROM user_settings WHERE user_id = ?");
    $stmt->execute([$userId]);
    $settings = $stmt->fetch();

    if (!$settings) {
        // Jika user baru dan belum punya record settings, buatkan satu
        $db->prepare("INSERT INTO user_settings (user_id) VALUES (?)")->execute([$userId]);
        $settings = [
            'user_id' => $userId,
            'receives_email_notifications' => 1,
            'theme' => 'system',
            'language' => 'id'
        ];
    }
    
    // Konversi boolean dari integer
    $settings['receives_email_notifications'] = (bool)$settings['receives_email_notifications'];

    ApiResponse::success($settings, 'Pengaturan berhasil dimuat');

} catch (Exception $e) {
    ApiResponse::serverError('Gagal memuat pengaturan: ' . $e->getMessage());
}