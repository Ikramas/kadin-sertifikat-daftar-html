<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/JWT.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['refresh_token'])) {
        ApiResponse::error('Refresh token tidak ditemukan.', 400); // Lebih spesifik
    }
    
    $refreshToken = $input['refresh_token'];

    // Decode and validate the refresh token
    // JWT::decode akan melempar Exception jika token tidak valid atau kedaluwarsa
    $decodedRefreshToken = JWT::decode($refreshToken);

    // Check if it's actually a refresh token
    // Payload dari JWT::decode() adalah objek atau array. Kita asumsikan array.
    if (!isset($decodedRefreshToken['type']) || $decodedRefreshToken['type'] !== 'refresh') {
        logSecurityEvent('refresh_token_wrong_type', "Attempt to use non-refresh token for refresh.");
        ApiResponse::error('Token yang diberikan bukan refresh token.', 401);
    }

    // Optionally, implement refresh token revocation here (e.g., check against a blacklist/database)
    // If you store refresh tokens in DB, you'd check $decodedRefreshToken['token_id'] here.
    // For now, we'll assume a valid, non-expired refresh token is sufficient.

    // Get user_id and email from the refresh token payload
    $userId = $decodedRefreshToken['user_id'];
    $userEmail = $decodedRefreshToken['email'];

    // Connect to database to verify user existence (optional but recommended)
    $database = new Database();
    $db = $database->getConnection();
    
    $stmt = $db->prepare("SELECT id, email, status, role FROM users WHERE id = ? AND email = ?");
    $stmt->execute([$userId, $userEmail]);
    $user = $stmt->fetch();

    if (!$user) {
        logSecurityEvent('refresh_token_user_not_found', "User not found for refresh token: $userEmail");
        ApiResponse::error('Pengguna tidak ditemukan untuk refresh token ini.', 401);
    }

    // Generate a new Access Token
    $newAccessTokenPayload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'status' => $user['status'],
        'type' => 'access'
    ];
    $newAccessToken = JWT::encode($newAccessTokenPayload, 900); // New access token valid for 15 minutes

    ApiResponse::success([
        'access_token' => $newAccessToken,
    ], 'Access token berhasil diperbarui.');

} catch (Exception $e) {
    // Catch-all for any JWT decoding errors (e.g., expired, invalid signature, malformed)
    logApiRequest('POST', '/api/auth/refresh-token', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal memperbarui token: ' . $e->getMessage());
}