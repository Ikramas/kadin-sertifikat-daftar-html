<?php
// tes-login-api.php (FIXED)

echo "<h1>Tes API Login & Endpoint Terproteksi</h1>";

// File untuk menyimpan cookie session sementara
$cookie_file = __DIR__ . '/cookie.txt';

// --- LANGKAH 1: DAPATKAN CSRF TOKEN ---
$csrf_url = "http://localhost/backend/api/auth/csrf-token.php";
$ch_csrf = curl_init($csrf_url);
curl_setopt($ch_csrf, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_csrf, CURLOPT_COOKIEJAR, $cookie_file); // Simpan cookie setelah request ini
curl_setopt($ch_csrf, CURLOPT_COOKIEFILE, $cookie_file); // Gunakan cookie jika ada (untuk konsistensi)

$csrf_response = curl_exec($ch_csrf);
$csrf_httpcode = curl_getinfo($ch_csrf, CURLINFO_HTTP_CODE);
curl_close($ch_csrf);

if ($csrf_httpcode !== 200) {
    die("<p style='color:red;'>❌ Gagal mendapatkan CSRF token. HTTP Code: $csrf_httpcode</p><pre>" . htmlspecialchars($csrf_response) . "</pre>");
}

$csrf_data = json_decode($csrf_response, true);
$csrf_token = $csrf_data['data']['csrf_token'] ?? null;

if (!$csrf_token) {
    die("<p style='color:red;'>❌ Gagal parsing CSRF token dari response.</p>");
}
echo "<p>✅ Mendapatkan CSRF Token.</p>";

// --- LANGKAH 2: LOGIN ---
$login_url = "http://localhost/backend/api/auth/login.php";
$login_data = [
    'email' => 'admin@bski-portal.com', // Gunakan user admin default
    'password' => 'Admin123!',
    'csrf_token' => $csrf_token
];

$ch_login = curl_init($login_url);
curl_setopt($ch_login, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_login, CURLOPT_POST, true);
curl_setopt($ch_login, CURLOPT_POSTFIELDS, json_encode($login_data));
curl_setopt($ch_login, CURLOPT_COOKIEJAR, $cookie_file); // Terus gunakan file cookie yang sama
curl_setopt($ch_login, CURLOPT_COOKIEFILE, $cookie_file); // Kirim cookie dari request sebelumnya
curl_setopt($ch_login, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-CSRF-Token: ' . $csrf_token
]);

$login_response = curl_exec($ch_login);
$login_httpcode = curl_getinfo($ch_login, CURLINFO_HTTP_CODE);
curl_close($ch_login);

echo "<h2>1. Hasil Tes Login</h2>";
echo "<p>HTTP Status Code: <strong>$login_httpcode</strong></p>";

$login_result = json_decode($login_response, true);
$jwt_token = $login_result['data']['token'] ?? null;

if ($login_httpcode == 200 && $jwt_token) {
    echo "<p style='color:green;'>✅ Tes Login Berhasil! Mendapatkan JWT Token.</p>";
} else {
    echo "<p style='color:red;'>❌ Tes Login Gagal.</p>";
    echo "<pre>" . htmlspecialchars(print_r($login_result, true)) . "</pre>";
    if (file_exists($cookie_file)) { unlink($cookie_file); }
    exit;
}

// --- LANGKAH 3: AKSES ENDPOINT TERPROTEKSI ---
echo "<h2>2. Tes Endpoint Terproteksi (/api/users/profile.php)</h2>";
$profile_url = "http://localhost/backend/api/users/profile.php";

$ch_profile = curl_init($profile_url);
curl_setopt($ch_profile, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_profile, CURLOPT_COOKIEJAR, $cookie_file); // Terus gunakan file cookie yang sama
curl_setopt($ch_profile, CURLOPT_COOKIEFILE, $cookie_file); // Kirim cookie dari request sebelumnya
curl_setopt($ch_profile, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $jwt_token
]);

$profile_response = curl_exec($ch_profile);
$profile_httpcode = curl_getinfo($ch_profile, CURLINFO_HTTP_CODE);
curl_close($ch_profile);

// Hapus file cookie sementara
if (file_exists($cookie_file)) {
    unlink($cookie_file);
}

echo "<p>HTTP Status Code: <strong>$profile_httpcode</strong></p>";
echo "<pre>" . htmlspecialchars(print_r(json_decode($profile_response, true), true)) . "</pre>";

if ($profile_httpcode == 200) {
    echo "<p style='color:green;'>✅ Berhasil Mengakses Endpoint Terproteksi!</p>";
} else {
    echo "<p style='color:red;'>❌ Gagal Mengakses Endpoint Terproteksi.</p>";
}