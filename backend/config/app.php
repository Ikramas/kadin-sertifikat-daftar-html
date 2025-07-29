<?php
// File: backend/config/app.php

// Load Composer's autoloader
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
}

// Load environment variables from .env file
if (class_exists('Dotenv\Dotenv')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
}

// --- Definisi Konstanta Aplikasi ---

// URL Dasar Aplikasi (digunakan untuk link di PDF, dll.)
define('APP_BASE_URL', $_ENV['APP_BASE_URL'] ?? 'http://localhost/backend'); // Sesuaikan dengan URL backend Anda

// URL Frontend Aplikasi (digunakan untuk CORS)
define('APP_FRONTEND_URL', $_ENV['APP_FRONTEND_URL'] ?? 'http://localhost:3000'); // Sesuaikan dengan URL frontend Anda

// Direktori untuk unggahan dokumen umum
define('DOCUMENTS_UPLOAD_DIR', __DIR__ . '/../uploads/documents/');

// Direktori untuk unggahan file SBU (misal PDF sertifikat)
define('SBU_FILES_UPLOAD_DIR', __DIR__ . '/../uploads/sbu_files/');

// Direktori untuk aset gambar (logo, dll.)
define('ASSETS_IMAGES_DIR', __DIR__ . '/../assets/images/');

// --- Konfigurasi Database (contoh, sesuaikan dengan Database.php) ---
// define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
// define('DB_NAME', $_ENV['DB_NAME'] ?? 'kadin_sbu');
// define('DB_USER', $_ENV['DB_USER'] ?? 'root');
// define('DB_PASS', $_ENV['DB_PASS'] ?? '');

// --- Konfigurasi Mailer (contoh, sesuaikan dengan OTPManager.php) ---
// define('MAIL_USERNAME', $_ENV['MAIL_USERNAME'] ?? '');
// define('MAIL_PASSWORD', $_ENV['MAIL_PASSWORD'] ?? '');
// define('MAIL_HOST', $_ENV['MAIL_HOST'] ?? 'smtp.gmail.com');
// define('MAIL_PORT', $_ENV['MAIL_PORT'] ?? 587);
// define('MAIL_ENCRYPTION', $_ENV['MAIL_ENCRYPTION'] ?? 'tls'); // 'tls' atau 'ssl'
// define('MAIL_FROM_ADDRESS', $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@yourdomain.com');
// define('MAIL_FROM_NAME', $_ENV['MAIL_FROM_NAME'] ?? 'BSKI Portal');

// --- JWT Secret Key ---
// define('JWT_SECRET_KEY', $_ENV['JWT_SECRET_KEY'] ?? 'your-super-secure-default-key-DO-NOT-USE-IN-PRODUCTION');