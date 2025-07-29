<?php
// File: backend/api/companies/list.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Memastikan Admin yang mengakses
    $adminUser = JWT::requireAuth();
    if ($adminUser['role'] !== 'admin' && $adminUser['role'] !== 'super_admin') {
        ApiResponse::forbidden('Hanya administrator yang dapat melihat daftar perusahaan.');
    }

    $database = new Database();
    $db = $database->getConnection();

    // Menggabungkan data perusahaan dengan data pengguna terkait
    $stmt = $db->prepare("
        SELECT 
            c.*, 
            u.name as user_name, u.email as user_email, u.status as user_status
        FROM companies c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
    ");
    $stmt->execute();
    $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format data untuk tampilan frontend
    foreach ($companies as &$company) {
        $company['created_at_formatted'] = date('d M Y H:i', strtotime($company['created_at']));
        $company['updated_at_formatted'] = date('d M Y H:i', strtotime($company['updated_at']));
        // Masking NPWP jika tidak diverifikasi penuh (opsional, tergantung kebijakan)
        // $company['npwp_masked'] = substr($company['npwp'], 0, 2) . str_repeat('X', 13) . substr($company['npwp'], -2);
    }

    logApiRequest('GET', '/api/companies/list', null, ['success' => true, 'total_companies' => count($companies)], $adminUser['user_id']);
    ApiResponse::success(['companies' => $companies, 'total' => count($companies)], 'Daftar perusahaan berhasil dimuat.');

} catch (Exception $e) {
    ErrorLogger::logSystemError('admin_company_list_error', $e->getMessage(), ['admin_id' => $adminUser['user_id'] ?? 'N/A']);
    logApiRequest('GET', '/api/companies/list', null, $e->getMessage(), $adminUser['user_id'] ?? 'N/A');
    ApiResponse::serverError('Gagal memuat daftar perusahaan: ' . $e->getMessage());
}