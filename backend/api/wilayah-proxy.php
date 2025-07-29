<?php
// File: backend/api/wilayah-proxy.php

// Pastikan semua file dependensi di-require_once secara eksplisit.
// Menggunakan jalur absolut berdasarkan DOCUMENT_ROOT untuk keandalan.
// Sesuaikan '/backend/' di bawah jika folder backend Anda memiliki nama lain atau berada di lokasi berbeda.
require_once $_SERVER['DOCUMENT_ROOT'] . '/backend/error_handler.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/backend/config/cors.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/backend/classes/ApiResponse.php';

// Endpoint dasar dari API wilayah Indonesia
$baseApiUrl = 'https://emsifa.github.io/api-wilayah-indonesia/api/';

// Pastikan permintaan adalah GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Ambil path yang diminta dari query parameter, misal 'provinces', 'regencies/11', 'districts/3204'
    $path = $_GET['path'] ?? null;

    if (!$path) {
        ApiResponse::error('Parameter path API wilayah tidak disediakan.', 400);
    }

    // Bangun URL lengkap ke API eksternal
    $fullUrl = $baseApiUrl . $path . '.json'; // Menambahkan .json karena API Emsifa menggunakan itu

    // Lakukan permintaan cURL ke API eksternal
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $fullUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, false); // Jangan sertakan header respons dalam output
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // <--- INI PENTING: Ikuti pengalihan HTTP

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        error_log("cURL Error: " . $curlError);
        ApiResponse::serverError("Gagal mengambil data wilayah dari sumber eksternal: " . $curlError);
    }

    // Dekode respons JSON
    $data = json_decode($response, true);

    if ($httpCode !== 200 || json_last_error() !== JSON_ERROR_NONE) {
        error_log("Failed to fetch data from Emsifa API: URL " . $fullUrl . " HTTP Code " . $httpCode . " Response: " . $response);
        $externalErrorMessage = isset($data['message']) ? $data['message'] : 'Tidak dapat mengambil data dari API wilayah eksternal.';
        ApiResponse::error($externalErrorMessage, $httpCode);
    }

    // Kirim data yang diterima kembali ke frontend
    ApiResponse::success($data, 'Data wilayah berhasil dimuat.');

} catch (Exception $e) {
    error_log("Error in wilayah-proxy.php: " . $e->getMessage());
    ApiResponse::serverError('Terjadi kesalahan pada proxy wilayah: ' . $e->getMessage());
}
?>