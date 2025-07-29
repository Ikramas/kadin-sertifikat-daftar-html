<?php
// your_project_root/backend/check_env.php

// Ini akan menampilkan error PHP apa pun langsung di browser
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Path ke autoload.php dari check_env.php
// Asumsi vendor/ ada di dalam backend/
require_once __DIR__ . '/vendor/autoload.php'; 

try {
    // Path ke direktori ROOT proyek (satu level di atas backend/)
    // Ini mengasumsikan .env ada di your_project_root/.env
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..'); 
    $dotenv->load(); 

    echo "<pre>===== DEBUG OUTPUT FOR .ENV VARIABLES =====\n";
    echo "APP_ENV: "; var_dump(getenv('APP_ENV'));
    echo "APP_DEBUG: "; var_dump(getenv('APP_DEBUG'));
    echo "JWT_SECRET_KEY: "; var_dump(getenv('JWT_SECRET_KEY')); 
    echo "DB_HOST: "; var_dump(getenv('DB_HOST'));
    echo "DB_NAME: "; var_dump(getenv('DB_NAME'));
    echo "DB_USER: "; var_dump(getenv('DB_USER'));
    echo "DB_PASS: "; var_dump(getenv('DB_PASS'));
    echo "MAIL_HOST: "; var_dump(getenv('MAIL_HOST'));
    echo "MAIL_PORT: "; var_dump(getenv('MAIL_PORT'));
    echo "MAIL_USERNAME: "; var_dump(getenv('MAIL_USERNAME'));
    echo "MAIL_PASSWORD: "; var_dump(getenv('MAIL_PASSWORD'));
    echo "MAIL_ENCRYPTION: "; var_dump(getenv('MAIL_ENCRYPTION'));
    echo "===== END DEBUG OUTPUT =====</pre>";

} catch (Dotenv\Exception\InvalidPathException $e) {
    echo "<pre>ERROR: File .env tidak ditemukan di: " . htmlspecialchars($e->getPath()) . "</pre>";
} catch (Exception $e) {
    echo "<pre>ERROR: Terjadi kesalahan saat memuat .env: " . htmlspecialchars($e->getMessage()) . "</pre>";
}

echo "<p>Cek output di atas. Jika Anda melihat nilai variabel, berarti .env berhasil dimuat.</p>";