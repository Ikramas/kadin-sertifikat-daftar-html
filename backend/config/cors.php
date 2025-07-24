<?php
require_once __DIR__ . '/../error_handler.php';

// Set CORS headers
header("Access-Control-Allow-Origin: http://localhost:8080");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    logApiRequest('OPTIONS', $_SERVER['REQUEST_URI']);
    http_response_code(200);
    exit();
}

// Start session for CSRF tokens
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}