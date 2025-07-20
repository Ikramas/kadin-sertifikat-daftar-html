<?php
// tes-security.php
require_once 'classes/SecurityManager.php';

echo "<h1>Tes Fungsionalitas Keamanan (SecurityManager)</h1>";

// 1. Tes Hashing & Verifikasi Password
echo "<h2>1. Tes Password Hashing</h2>";
$password = "Admin123!";
$hashedPassword = SecurityManager::hashPassword($password);

echo "<p>Password Asli: " . htmlspecialchars($password) . "</p>";
echo "<p>Password Hash (Argon2ID): " . htmlspecialchars($hashedPassword) . "</p>";

if (SecurityManager::verifyPassword($password, $hashedPassword)) {
    echo "<p style='color:green;'>✅ Verifikasi password berhasil!</p>";
} else {
    echo "<p style='color:red;'>❌ Verifikasi password gagal.</p>";
}

// 2. Tes Sanitasi Input
echo "<h2>2. Tes Sanitasi Input</h2>";
$dirtyInput = "<script>alert('xss');</script> SELECT * FROM users;";
$cleanInput = SecurityManager::sanitizeInput($dirtyInput);

echo "<p>Input Kotor: " . htmlspecialchars($dirtyInput) . "</p>";
echo "<p>Input Bersih: " . htmlspecialchars($cleanInput) . "</p>";

if ($cleanInput !== $dirtyInput && !str_contains($cleanInput, '<script>')) {
    echo "<p style='color:green;'>✅ Sanitasi input berhasil!</p>";
} else {
    echo "<p style='color:red;'>❌ Sanitasi input gagal.</p>";
}