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
    $currentUser = JWT::requireAuth();
    CSRFProtection::requireValidToken();

    $input = json_decode(file_get_contents('php://input'), true);
    $input = SecurityManager::sanitizeInput($input);

    $currentPassword = $input['current_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    $confirmNewPassword = $input['confirm_new_password'] ?? '';

    $validator = new Validator();
    $validator->required('current_password', $currentPassword, 'Password saat ini wajib diisi');
    $validator->required('new_password', $newPassword, 'Password baru wajib diisi');
    $validator->password('new_password', $newPassword, 'Password baru minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, dan angka');
    $validator->match('confirm_new_password', $newPassword, $confirmNewPassword, 'Konfirmasi password baru tidak cocok');
    $validator->validate();

    $database = new Database();
    $db = $database->getConnection();

    $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$currentUser['user_id']]);
    $user = $stmt->fetch();

    if (!$user || !SecurityManager::verifyPassword($currentPassword, $user['password'])) {
        ApiResponse::error('Password saat ini tidak cocok.');
    }

    $hashedNewPassword = SecurityManager::hashPassword($newPassword);
    $stmt = $db->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$hashedNewPassword, $currentUser['user_id']]);

    ApiResponse::success(null, 'Password berhasil diubah.');

} catch (Exception $e) {
    ApiResponse::serverError('Gagal mengubah password: ' . $e->getMessage());
}
?>