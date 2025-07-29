<?php
// File: backend/api/auth/refresh-token.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; // Pastikan ErrorLogger dimuat

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['refresh_token'])) {
        ApiResponse::error('Refresh token tidak ditemukan.', 400);
    }
    
    $refreshToken = $input['refresh_token'];

    // Decode and validate the refresh token
    // JWT::decode akan melempar Exception jika token tidak valid atau kedaluwarsa
    $decodedRefreshToken = JWT::decode($refreshToken);

    // Check if it's actually a refresh token (added 'type' to refresh token payload)
    if (!isset($decodedRefreshToken['type']) || $decodedRefreshToken['type'] !== 'refresh') {
        logSecurityEvent('refresh_token_wrong_type', "Attempt to use non-refresh token for refresh. User ID: " . ($decodedRefreshToken['user_id'] ?? 'N/A'));
        ApiResponse::error('Token yang diberikan bukan refresh token.', 401);
    }

    // Optionally, implement refresh token revocation here (e.g., check against a blacklist/database)
    // For refresh tokens, you typically store them in a database and revoke after use or when user logs out
    // You might also generate a new refresh token here and revoke the old one.
    
    // Get user_id and email from the refresh token payload
    $userId = $decodedRefreshToken['user_id'];
    $userEmail = $decodedRefreshToken['email'];

    // Connect to database to verify user existence and status
    $database = new Database();
    $db = $database->getConnection();
    
    $stmt = $db->prepare("SELECT id, email, status, role FROM users WHERE id = ? AND email = ?");
    $stmt->execute([$userId, $userEmail]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        logSecurityEvent('refresh_token_user_not_found', "User not found for refresh token: $userEmail");
        ApiResponse::error('Pengguna tidak ditemukan untuk refresh token ini.', 401);
    }

    // Periksa status pengguna. Hanya user aktif/terverifikasi yang bisa me-refresh token.
    if (!in_array($user['status'], ['active', 'verified', 'pending_document_verification', 'pending_admin_approval'])) {
        logSecurityEvent('refresh_token_invalid_user_status', "User with invalid status attempting refresh: $userEmail (Status: {$user['status']})");
        ApiResponse::forbidden('Status akun tidak valid untuk memperbarui sesi.');
    }

    // Generate a new Access Token
    $newAccessTokenPayload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'status' => $user['status'], // Sertakan status terbaru user
        'type' => 'access' // Tipe token akses
    ];
    $newAccessToken = JWT::encode($newAccessTokenPayload, 900); // New access token valid for 15 minutes (900 detik)

    // Opsional: Generate new refresh token dan invalidate yang lama
    // $newRefreshTokenPayload = ['user_id' => $user['id'], 'email' => $user['email'], 'type' => 'refresh'];
    // $newRefreshToken = JWT::encode($newRefreshTokenPayload, 604800); // 7 hari (contoh)
    // JWT::denyToken($refreshToken); // Deny the old refresh token

    logApiRequest('POST', '/api/auth/refresh-token', ['user_id' => $userId], 'success');

    ApiResponse::success([
        'access_token' => $newAccessToken,
        // 'refresh_token' => $newRefreshToken // Jika Anda juga me-refresh refresh token
    ], 'Access token berhasil diperbarui.');

} catch (Exception $e) {
    // Catch-all for any JWT decoding errors (e.g., expired, invalid signature, malformed)
    ErrorLogger::logSystemError('auth_refresh_token_failed', $e->getMessage(), ['input' => $input ?? null]);
    logApiRequest('POST', '/api/auth/refresh-token', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal memperbarui token: ' . $e->getMessage());
}