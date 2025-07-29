<?php
// File: backend/error_handler.php

// Pastikan ErrorLogger dimuat sebelum mencoba menggunakannya
// Gunakan __DIR__ untuk path absolut yang lebih handal
require_once __DIR__ . '/classes/ErrorLogger.php';

// --- PERBAIKAN KRITIS: Inisialisasi ErrorLogger secara eksplisit ---
// Ini memastikan constructor ErrorLogger dijalankan sekali,
// yang mengatur properti statis dan membuat direktori log.
new ErrorLogger();
// --- AKHIR PERBAIKAN KRITIS ---

// Set custom error handler
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    // Error levels that we want to log but not necessarily stop execution for
    if (! (error_reporting() & $errno)) {
        return false; // Error has been suppressed
    }

    $errorType = 'PHP Notice';
    switch ($errno) {
        case E_ERROR:
        case E_CORE_ERROR:
        case E_COMPILE_ERROR:
        case E_USER_ERROR:
            $errorType = 'PHP Fatal Error';
            break;
        case E_WARNING:
        case E_USER_WARNING:
        case E_COMPILE_WARNING:
        case E_RECOVERABLE_ERROR:
            $errorType = 'PHP Warning';
            break;
        case E_NOTICE:
        case E_USER_NOTICE:
            $errorType = 'PHP Notice';
            break;
        case E_DEPRECATED:
        case E_USER_DEPRECATED:
            $errorType = 'PHP Deprecated';
            break;
    }

    ErrorLogger::logSystemError(
        'php_error',
        "{$errorType}: {$errstr}",
        [
            'file' => $errfile,
            'line' => $errline,
            'errno' => $errno
        ]
    );

    // Don't execute PHP's internal error handler
    return true;
});

// Set custom exception handler
set_exception_handler(function ($exception) {
    ErrorLogger::logSystemError(
        'uncaught_exception',
        $exception->getMessage(),
        [
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
            'code' => $exception->getCode()
        ]
    );

    // Optionally, send a generic error response for uncaught exceptions
    // if (class_exists('ApiResponse')) {
    //     ApiResponse::serverError('Terjadi kesalahan server yang tidak terduga.');
    // } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Terjadi kesalahan server yang tidak terduga."]);
    // }
    exit();
});

// --- FUNGSI GLOBAL HELPER UNTUK LOGGING ---

/**
 * Global helper function to log API requests.
 * Internally calls ErrorLogger::logApiRequest.
 * @param string $method HTTP method (GET, POST, etc.)
 * @param string $uri Request URI
 * @param array|null $input_summary Summarized request input
 * @param mixed $response_status Response status or error message
 * @param int|string|null $userId User ID if available (passed through from JWT etc.)
 */
function logApiRequest($method, $uri, $input_summary = null, $response_status = null, $userId = null) {
    ErrorLogger::logApiRequest($method, $uri, $input_summary, $response_status, $userId);
}

/**
 * Global helper function to log security events.
 * Internally calls ErrorLogger::logSecurityEvent.
 * @param string $type Type of security event (e.g., 'login_failed', 'unauthorized_access')
 * @param string $message Detailed message for the event
 * @param array|null $details Additional context or data
 */
function logSecurityEvent($type, $message, $details = null) {
    ErrorLogger::logSecurityEvent($type, $message, $details);
}

// Tambahan: Pastikan semua konstanta direktori di config/app.php dimuat
// Ini penting agar ErrorLogger dan file lain dapat menemukan direktori
require_once __DIR__ . '/config/app.php'; 

// Jika Anda memiliki fungsi log lain yang dipanggil secara global,
// tambahkan definisi globalnya di sini juga.

?>