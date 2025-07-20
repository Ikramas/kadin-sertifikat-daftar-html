<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/JWT.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    $currentUser = JWT::requireAuth(); // Pastikan pengguna terautentikasi
    CSRFProtection::requireValidToken(); // Validasi CSRF token

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid');
    }
    $input = SecurityManager::sanitizeInput($input);

    $database = new Database();
    $db = $database->getConnection();
    $db->beginTransaction();

    // Logika untuk memperbarui data pengguna
    $name = $input['name'] ?? null;
    $phone = $input['phone'] ?? null;
    if ($name || $phone) {
        $stmt = $db->prepare("UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), updated_at = NOW() WHERE id = ?");
        $stmt->execute([$name, $phone, $currentUser['user_id']]);
    }

    // Logika untuk memperbarui data perusahaan (jika ada)
    $companyName = $input['company_name'] ?? null;
    $companyAddress = $input['address'] ?? null;
    $companyEmail = $input['company_email'] ?? null;
    $companyPhone = $input['company_phone'] ?? null;

    if ($companyName || $companyAddress || $companyEmail || $companyPhone) {
        $stmt = $db->prepare("UPDATE companies SET company_name = COALESCE(?, company_name), address = COALESCE(?, address), company_email = COALESCE(?, company_email), company_phone = COALESCE(?, company_phone), updated_at = NOW() WHERE user_id = ?");
        $stmt->execute([$companyName, $companyAddress, $companyEmail, $companyPhone, $currentUser['user_id']]);
    }

    $db->commit();
    ApiResponse::success(null, 'Profil berhasil diperbarui.');

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollback();
    }
    ApiResponse::serverError('Gagal memperbarui profil: ' . $e->getMessage());
}
?>