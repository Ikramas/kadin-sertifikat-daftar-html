<?php
// File: backend/api/dashboard/stats.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; // Pastikan ErrorLogger dimuat

// Pastikan semua header CORS dimuat dari config/cors.php
// header("Access-Control-Allow-Origin: *"); // Hapus ini, sudah ditangani di cors.php
// header("Content-Type: application/json; charset=UTF-8"); // Hapus ini, sudah ditangani di cors.php
// header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); // Hapus ini, sudah ditangani di cors.php
// header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-CSRF-Token"); // Hapus ini, sudah ditangani di cors.php

// Tangani permintaan OPTIONS (preflight request untuk CORS) sudah ada di cors.php
// if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
//     http_response_code(200);
//     exit();
// }

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Memastikan pengguna terautentikasi
    $currentUser = JWT::requireAuth();

    $database = new Database();
    $db = $database->getConnection();

    // Query untuk Total Applications
    $stmtTotalApp = $db->prepare("SELECT COUNT(*) FROM applications WHERE user_id = ?");
    $stmtTotalApp->execute([$currentUser['user_id']]);
    $totalApplications = $stmtTotalApp->fetchColumn();

    // Query untuk Pending Processes (submitted, under_review)
    $stmtPending = $db->prepare("SELECT COUNT(*) FROM applications WHERE user_id = ? AND status IN ('submitted', 'under_review')");
    $stmtPending->execute([$currentUser['user_id']]);
    $pendingProcesses = $stmtPending->fetchColumn();

    // Query untuk Approved Applications (approved, completed)
    $stmtApproved = $db->prepare("SELECT COUNT(*) FROM applications WHERE user_id = ? AND status IN ('approved', 'completed')");
    $stmtApproved->execute([$currentUser['user_id']]);
    $approved = $stmtApproved->fetchColumn();

    // Query untuk Active Certificates (status 'active')
    $stmtActiveCert = $db->prepare("SELECT COUNT(*) FROM certificates WHERE user_id = ? AND status = 'active' AND expiry_date > NOW()");
    $stmtActiveCert->execute([$currentUser['user_id']]);
    $activeCertificates = $stmtActiveCert->fetchColumn();

    // Ambil waktu update terakhir dari tabel applications atau certificates
    // Atau dari record log terakhir untuk data dashboard
    $stmtLastUpdate = $db->prepare("
        SELECT GREATEST(
            (SELECT MAX(updated_at) FROM applications WHERE user_id = ?),
            (SELECT MAX(updated_at) FROM certificates WHERE user_id = ?),
            (SELECT MAX(updated_at) FROM companies WHERE user_id = ?)
        ) as last_updated
    ");
    $stmtLastUpdate->execute([$currentUser['user_id'], $currentUser['user_id'], $currentUser['user_id']]);
    $lastUpdated = $stmtLastUpdate->fetchColumn();


    $response_data = [
        "totalApplications" => (int)$totalApplications,
        "pendingProcesses" => (int)$pendingProcesses,
        "approved" => (int)$approved,
        "activeCertificates" => (int)$activeCertificates,
        "lastUpdated" => $lastUpdated ? date('Y-m-d H:i:s', strtotime($lastUpdated)) : null,
    ];
    
    logApiRequest('GET', '/api/dashboard/stats', ['user_id' => $currentUser['user_id']], 'success');

    ApiResponse::success($response_data, "Data dashboard berhasil dimuat.");

} catch (Exception $e) {
    ErrorLogger::logSystemError('dashboard_stats_fetch', $e->getMessage(), ['user_id' => $currentUser['user_id'] ?? null]);
    logApiRequest('GET', '/api/dashboard/stats', ['user_id' => $currentUser['user_id'] ?? null], $e->getMessage());
    ApiResponse::serverError('Gagal memuat statistik dasbor: ' . $e->getMessage());
}
?>