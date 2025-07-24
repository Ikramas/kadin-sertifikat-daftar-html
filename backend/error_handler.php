<?php
// Global Error Handler untuk BSKI Portal
// File ini harus di-include di setiap file API PHP

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Create logs directory if it doesn't exist
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

// Set error log file
ini_set('error_log', $logDir . '/php_errors.log');

// Custom error handler
function customErrorHandler($severity, $message, $file, $line) {
    $logMessage = "[" . date('Y-m-d H:i:s') . "] ERROR: $message in $file on line $line" . PHP_EOL;
    file_put_contents(__DIR__ . '/../logs/php_errors.log', $logMessage, FILE_APPEND | LOCK_EX);
    
    // Don't execute PHP internal error handler
    return true;
}

// Custom exception handler
function customExceptionHandler($exception) {
    $logMessage = "[" . date('Y-m-d H:i:s') . "] EXCEPTION: " . $exception->getMessage() . 
                  " in " . $exception->getFile() . " on line " . $exception->getLine() . PHP_EOL;
    file_put_contents(__DIR__ . '/../logs/php_errors.log', $logMessage, FILE_APPEND | LOCK_EX);
    
    // Send clean error response to frontend
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Terjadi kesalahan sistem. Tim kami telah diberitahu dan sedang menangani masalah ini.',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

// Custom fatal error handler
function customFatalErrorHandler() {
    $error = error_get_last();
    if ($error && ($error['type'] & (E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR))) {
        $logMessage = "[" . date('Y-m-d H:i:s') . "] FATAL ERROR: " . $error['message'] . 
                      " in " . $error['file'] . " on line " . $error['line'] . PHP_EOL;
        file_put_contents(__DIR__ . '/../logs/php_errors.log', $logMessage, FILE_APPEND | LOCK_EX);
        
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 'error',
                'message' => 'Terjadi kesalahan fatal pada sistem. Tim kami telah diberitahu.',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
        }
    }
}

// Set custom handlers
set_error_handler('customErrorHandler');
set_exception_handler('customExceptionHandler');
register_shutdown_function('customFatalErrorHandler');

// Function to log API requests
function logApiRequest($method, $endpoint, $data = null, $response = null, $userId = null) {
    $logMessage = [
        'timestamp' => date('Y-m-d H:i:s'),
        'method' => $method,
        'endpoint' => $endpoint,
        'user_id' => $userId,
        'request_data' => $data,
        'response' => $response,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    file_put_contents(__DIR__ . '/../logs/api_requests.log', 
                     json_encode($logMessage) . PHP_EOL, 
                     FILE_APPEND | LOCK_EX);
}

// Function to log security events
function logSecurityEvent($event, $details, $userId = null) {
    $logMessage = [
        'timestamp' => date('Y-m-d H:i:s'),
        'event' => $event,
        'details' => $details,
        'user_id' => $userId,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    file_put_contents(__DIR__ . '/../logs/security_events.log', 
                     json_encode($logMessage) . PHP_EOL, 
                     FILE_APPEND | LOCK_EX);
}