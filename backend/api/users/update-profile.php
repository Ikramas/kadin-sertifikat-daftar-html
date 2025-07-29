<?php
// File: backend/api/users/update-profile.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; // Pastikan ErrorLogger dimuat

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    $currentUser = JWT::requireAuth(); 
    CSRFProtection::requireValidToken(); 

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid', 400); // Tambah kode status
    }
    $input = SecurityManager::sanitizeInput($input);

    $database = new Database();
    $db = $database->getConnection();
    $db->beginTransaction();

    $validator = new Validator();

    // Logika untuk memperbarui data pengguna
    $name = $input['name'] ?? null;
    $phone = $input['phone'] ?? null;

    if ($name !== null || $phone !== null) { // Hanya proses jika ada data yang dikirim
        if ($name !== null) {
            $validator->required('name', $name, 'Nama lengkap wajib diisi saat update');
            $validator->minLength('name', $name, 2, 'Nama minimal 2 karakter');
            $validator->maxLength('name', $name, 255, 'Nama maksimal 255 karakter');
        }
        if ($phone !== null) {
            $validator->required('phone', $phone, 'Nomor telepon wajib diisi saat update');
            $validator->phone('phone', $phone, 'Nomor telepon tidak valid');

            // Cek duplikasi nomor telepon (kecuali nomor sendiri)
            if (!empty($phone)) {
                $stmtCheckPhone = $db->prepare("SELECT id FROM users WHERE phone = ? AND id != ?");
                $stmtCheckPhone->execute([$phone, $currentUser['user_id']]);
                if ($stmtCheckPhone->fetch()) {
                    $validator->addError('phone', 'Nomor telepon sudah digunakan oleh akun lain.');
                }
            }
        }
        $validator->validate(); // Validasi input pengguna
        
        $stmt = $db->prepare("UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), updated_at = NOW() WHERE id = ?");
        $stmt->execute([$name, $phone, $currentUser['user_id']]);
    }

    // Logika untuk memperbarui data perusahaan (jika ada)
    $companyName = $input['company_name'] ?? null;
    $companyAddress = $input['address'] ?? null;
    $companyEmail = $input['company_email'] ?? null;
    $companyPhone = $input['company_phone'] ?? null;

    if ($companyName !== null || $companyAddress !== null || $companyEmail !== null || $companyPhone !== null) {
        // Fetch existing company data to ensure it belongs to the user
        $stmtCheckCompany = $db->prepare("SELECT id FROM companies WHERE user_id = ?");
        $stmtCheckCompany->execute([$currentUser['user_id']]);
        $companyExists = $stmtCheckCompany->fetch(PDO::FETCH_ASSOC);

        if (!$companyExists) {
            ApiResponse::notFound('Data perusahaan tidak ditemukan untuk pengguna ini.');
        }

        // Validasi input perusahaan
        if ($companyName !== null) {
            $validator->required('company_name', $companyName, 'Nama perusahaan wajib diisi saat update');
            $validator->minLength('company_name', $companyName, 2, 'Nama perusahaan minimal 2 karakter');
        }
        if ($companyAddress !== null) {
            $validator->required('address', $companyAddress, 'Alamat perusahaan wajib diisi saat update');
            $validator->minLength('address', $companyAddress, 10, 'Alamat minimal 10 karakter');
        }
        if ($companyEmail !== null) {
            $validator->required('company_email', $companyEmail, 'Email perusahaan wajib diisi saat update');
            $validator->email('company_email', $companyEmail, 'Format email perusahaan tidak valid');

            // Cek duplikasi email perusahaan (kecuali email sendiri)
            if (!empty($companyEmail)) {
                $stmtCheckCompanyEmail = $db->prepare("SELECT id FROM companies WHERE company_email = ? AND user_id != ?");
                $stmtCheckCompanyEmail->execute([$companyEmail, $currentUser['user_id']]);
                if ($stmtCheckCompanyEmail->fetch()) {
                    $validator->addError('company_email', 'Email perusahaan sudah digunakan oleh perusahaan lain.');
                }
            }
        }
        if ($companyPhone !== null) {
            $validator->required('company_phone', $companyPhone, 'Telepon perusahaan wajib diisi saat update');
            $validator->phone('company_phone', $companyPhone, 'Nomor telepon perusahaan tidak valid');
        }
        $validator->validate(); // Validasi input perusahaan
        
        $stmt = $db->prepare("UPDATE companies SET company_name = COALESCE(?, company_name), address = COALESCE(?, address), company_email = COALESCE(?, company_email), company_phone = COALESCE(?, company_phone), updated_at = NOW() WHERE user_id = ?");
        $stmt->execute([$companyName, $companyAddress, $companyEmail, $companyPhone, $currentUser['user_id']]);
    }

    $db->commit();
    logApiRequest('POST', '/api/users/update-profile', ['user_id' => $currentUser['user_id']], 'success');
    ApiResponse::success(null, 'Profil berhasil diperbarui.');

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollback();
    }
    ErrorLogger::logSystemError('user_profile_update_failed', $e->getMessage(), ['user_id' => $currentUser['user_id'] ?? null, 'input' => $input ?? null]);
    logApiRequest('POST', '/api/users/update-profile', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal memperbarui profil: ' . $e->getMessage());
}