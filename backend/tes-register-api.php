<?php
// tes-register-api.php (FIXED)

echo "<h1>Tes API Registrasi Pengguna</h1>";

// File untuk menyimpan cookie session sementara
$cookie_file = __DIR__ . '/cookie.txt';

// Ganti email ini setiap kali menjalankan tes
$testEmail = "testuser" . rand(1000, 9999) . "@example.com";

// --- LANGKAH 1: DAPATKAN CSRF TOKEN ---
$csrf_url = "http://localhost/backend/api/auth/csrf-token.php";
$ch_csrf = curl_init($csrf_url);
curl_setopt($ch_csrf, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_csrf, CURLOPT_COOKIEJAR, $cookie_file); // Simpan cookie setelah request ini
curl_setopt($ch_csrf, CURLOPT_COOKIEFILE, $cookie_file); // Gunakan cookie jika ada

$csrf_response = curl_exec($ch_csrf);
curl_close($ch_csrf);
$csrf_data = json_decode($csrf_response, true);
$csrf_token = $csrf_data['data']['csrf_token'] ?? null;

if (!$csrf_token) {
    die("<p style='color:red;'>❌ Gagal mendapatkan CSRF token.</p>");
}
echo "<p>✅ Mendapatkan CSRF Token: " . htmlspecialchars($csrf_token) . "</p>";


// --- LANGKAH 2: KIRIM DATA REGISTRASI ---
$url = "http://localhost/backend/api/auth/register.php";
$data = [
    "name" => "Test User",
    "email" => $testEmail,
    "phone" => "08123456" . rand(1000, 9999),
    "password" => "Test123!",
    "confirmPassword" => "Test123!",
    "companyName" => "PT Coba Coba",
    "npwp" => "12.345.678.9-123.456",
    "nib" => "1234567890123",
    "address" => "Jl. Uji Coba No. 123",
    "city" => "Jakarta",
    "postalCode" => "12345",
    "companyPhone" => "0211234567",
    "companyEmail" => "info@" . rand(1000, 9999) . ".com",
    "businessType" => "pt",
    "investmentValue" => "1000000000",
    "employeeCount" => "50",
    "termsAccepted" => true,
    "csrf_token" => $csrf_token
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie_file); // Terus gunakan file cookie yang sama
curl_setopt($ch, CURLOPT_COOKIEFILE, $cookie_file); // Kirim cookie dari request sebelumnya
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-CSRF-Token: ' . $csrf_token
]);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Hapus file cookie sementara
if (file_exists($cookie_file)) {
    unlink($cookie_file);
}

echo "<h2>Hasil Respon API:</h2>";
echo "<p>HTTP Status Code: <strong>$httpcode</strong></p>";
echo "<pre>" . htmlspecialchars(print_r(json_decode($response, true), true)) . "</pre>";

if ($httpcode == 200) {
    echo "<p style='color:green;'>✅ Tes Registrasi Berhasil!</p>";
} else {
    echo "<p style='color:red;'>❌ Tes Registrasi Gagal.</p>";
}