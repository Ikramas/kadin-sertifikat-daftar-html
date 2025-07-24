<?php
// tes-token.php
require_once 'classes/JWT.php';
require_once 'classes/CSRFProtection.php';

echo "<h1>Tes Token JWT & CSRF</h1>";

// 1. Tes JWT
echo "<h2>1. Tes JSON Web Token (JWT)</h2>";
$payload = ['user_id' => 1, 'role' => 'admin'];
$jwt = JWT::encode($payload);
echo "<p>Generated JWT: " . htmlspecialchars($jwt) . "</p>";

try {
    $decoded = JWT::decode($jwt);
    echo "<p style='color:green;'>✅ Dekode JWT berhasil!</p>";
    echo "<pre>" . htmlspecialchars(print_r($decoded, true)) . "</pre>";
} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Gagal mendekode JWT: " . $e->getMessage() . "</p>";
}

// 2. Tes CSRF
echo "<h2>2. Tes CSRF Token</h2>";
$csrfToken = CSRFProtection::generateToken();
echo "<p>Generated CSRF Token: " . htmlspecialchars($csrfToken) . "</p>";

if (CSRFProtection::validateToken($csrfToken)) {
    echo "<p style='color:green;'>✅ Validasi CSRF token berhasil!</p>";
} else {
    echo "<p style='color:red;'>❌ Validasi CSRF token gagal.</p>";
}