<?php
// File: backend/api/users/change-password.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; // Pastikan ErrorLogger dimuat

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    $currentUser = JWT::requireAuth();
    CSRFProtection::requireValidToken();

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid', 400);
    }
    $input = SecurityManager::sanitizeInput($input);

    $currentPassword = $input['current_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    $confirmNewPassword = $input['confirm_new_password'] ?? '';

    $validator = new Validator();
    $validator->required('current_password', $currentPassword, 'Password saat ini wajib diisi');
    $validator->required('new_password', $newPassword, 'Password baru wajib diisi');
    // Perbarui pesan validasi password agar sesuai dengan Validator::password()
    $validator->password('new_password', $newPassword, 'Password baru minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, dan simbol'); 
    $validator->match('confirm_new_password', $newPassword, $confirmNewPassword, 'Konfirmasi password baru tidak cocok');
    $validator->validate();

    $database = new Database();
    $db = $database->getConnection();

    $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$currentUser['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC); // Fetch as associative array

    if (!$user || !SecurityManager::verifyPassword($currentPassword, $user['password'])) {
        ErrorLogger::logSecurityEvent('change_password_failed', "User {$currentUser['user_id']} provided incorrect current password.");
        ApiResponse::error('Password saat ini tidak cocok.');
    }

    // Pastikan password baru berbeda dari password lama (opsional tapi disarankan)
    if (SecurityManager::verifyPassword($newPassword, $user['password'])) {
        ApiResponse::error('Password baru tidak boleh sama dengan password saat ini.');
    }

    $hashedNewPassword = SecurityManager::hashPassword($newPassword);
    $stmt = $db->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$hashedNewPassword, $currentUser['user_id']]);

    logApiRequest('POST', '/api/users/change-password', ['user_id' => $currentUser['user_id']], 'success');
    ApiResponse::success(null, 'Password berhasil diubah.');

} catch (Exception $e) {
    ErrorLogger::logSystemError('user_change_password_failed', $e->getMessage(), ['user_id' => $currentUser['user_id'] ?? null, 'input' => $input ?? null]);
    logApiRequest('POST', '/api/users/change-password', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal mengubah password: ' . $e->getMessage());
}