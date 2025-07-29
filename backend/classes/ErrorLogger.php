<?php
// File: backend/classes/ErrorLogger.php
// Asumsikan error_handler.php sudah memuat file ini.

// Untuk integrasi log eksternal (contoh)
// use Monolog\Logger;
// use Monolog\Handler\StreamHandler;
// use Monolog\Handler\SyslogHandler; // Untuk Syslog / Log Management System

class ErrorLogger {
    private static $logDir;
    // private static $monologLogger = null; // Untuk Monolog

    public function __construct() {
        self::$logDir = __DIR__ . '/../../logs';
        if (!is_dir(self::$logDir)) {
            mkdir(self::$logDir, 0755, true); // Pastikan direktori log dibuat dengan izin yang benar
        }
        
        // Contoh inisialisasi Monolog (jika diperlukan)
        // if (self::$monologLogger === null) {
        //     self::$monologLogger = new Logger('AppLogger');
        //     self::$monologLogger->pushHandler(new StreamHandler(self::$logDir . '/combined.log', Logger::DEBUG));
        //     // Tambahkan handler lain untuk produksi (misal: Syslog, file terpisah untuk error kritis)
        //     // self::$monologLogger->pushHandler(new SyslogHandler('AppLogger'), Logger::WARNING);
        // }
    }
    
    // Metode utama untuk menulis log ke file lokal
    private static function writeToLog($filename, $data) {
        new self(); // Pastikan direktori log sudah dibuat dan init Monolog
        $logFile = self::$logDir . '/' . $filename;
        $logEntry = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL . "---" . PHP_EOL;
        
        // Menggunakan FILE_APPEND dan LOCK_EX untuk penulisan yang aman
        if (!file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX)) {
            // Fallback: log ke stderr jika penulisan file gagal
            error_log("Failed to write to log file: {$logFile}. Data: " . json_encode($data));
        }
        
        // Contoh mengirim ke Monolog (jika diaktifkan)
        // if (self::$monologLogger) {
        //     // Sesuaikan level log berdasarkan jenis error
        //     self::$monologLogger->info(str_replace('.log', '', $filename) . ' event', $data);
        // }
    }

    /**
     * Membersihkan data sensitif dari log.
     * Akan mereplace nilai jika kunci/nilai mengandung kata kunci sensitif.
     * @param mixed $value Data yang akan disanitasi.
     * @return mixed Data yang sudah disanitasi.
     */
    public static function sanitizeForLog($value) {
        $sensitiveKeys = ['password', 'otp', 'token', 'access_token', 'refresh_token', 'private_key', 'secret', 'credentials', 'cc_number', 'cvv', 'bank_account'];
        $sensitiveValuesPatterns = [
            '/^Bearer\s[a-zA-Z0-9\-\._~+\/]+=*$/i', // JWT token
            '/^[0-9]{6}$/', // 6-digit OTP
            // Tambahkan pola lain jika diperlukan (misal: nomor kartu kredit)
        ];

        if (is_string($value)) {
            foreach ($sensitiveKeys as $keyword) {
                // Periksa apakah string mengandung kata kunci sensitif
                if (stripos($value, $keyword) !== false) {
                    return '[SENSITIVE_DATA_HIDDEN_BY_KEYWORD]';
                }
            }
            foreach ($sensitiveValuesPatterns as $pattern) {
                // Periksa apakah string cocok dengan pola nilai sensitif
                if (preg_match($pattern, $value)) {
                    return '[SENSITIVE_DATA_HIDDEN_BY_PATTERN]';
                }
            }
            // Batasi panjang string untuk mencegah log terlalu besar
            if (strlen($value) > 5000) { // Batasi string yang sangat panjang
                return substr($value, 0, 5000) . '...[TRUNCATED]';
            }
            return $value;
        }

        if (is_array($value)) {
            $sanitizedArray = [];
            foreach ($value as $key => $val) {
                // Sembunyikan nilai jika kunci array adalah sensitif
                if (in_array(strtolower($key), $sensitiveKeys)) {
                    $sanitizedArray[$key] = '[SENSITIVE_DATA_HIDDEN_BY_KEY]';
                } else {
                    $sanitizedArray[$key] = self::sanitizeForLog($val); // Rekursif
                }
            }
            return $sanitizedArray;
        }

        if (is_object($value)) {
            return self::sanitizeForLog((array)$value); // Konversi objek menjadi array untuk sanitasi
        }
        
        return $value;
    }
    
    public static function logUserError($context, $userMessage, $technicalDetails = null, $userId = null) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'context' => $context,
            'user_message' => $userMessage,
            'technical_details' => self::sanitizeForLog($technicalDetails),
            'user_id' => $userId,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
        ];
        self::writeToLog('user_errors.log', $logData);
    }
    
    public static function logSystemError($context, $errorMessage, $technicalDetails = null) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'context' => $context,
            'error_message' => $errorMessage,
            'technical_details' => self::sanitizeForLog($technicalDetails),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'memory_usage' => memory_get_usage(true),
            'memory_peak' => memory_get_peak_usage(true)
        ];
        self::writeToLog('system_errors.log', $logData);
    }
    
    public static function logDatabaseError($operation, $query, $error, $parameters = null) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'operation' => $operation,
            'query' => self::sanitizeForLog($query),
            'error' => self::sanitizeForLog($error),
            'parameters' => self::sanitizeForLog($parameters), // Sanitasi parameter query
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
        ];
        self::writeToLog('database_errors.log', $logData);
    }
    
    public static function logValidationError($field, $value, $rule, $message, $userId = null) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'field' => $field,
            'value' => self::sanitizeForLog($value),
            'rule' => $rule,
            'message' => $message,
            'user_id' => $userId,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
        ];
        self::writeToLog('validation_errors.log', $logData);
    }
    
    public static function logAuthenticationError($type, $email, $reason, $additionalData = null) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'type' => $type, // login, register, otp, etc.
            'email' => self::sanitizeForLog($email),
            'reason' => $reason,
            'additional_data' => self::sanitizeForLog($additionalData),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        self::writeToLog('authentication_errors.log', $logData);
    }
    
    public static function logPerformanceIssue($operation, $duration, $details = null) {
        // Log jika operasi memakan waktu lebih dari 500 ms (0.5 detik)
        if ($duration > 500) { 
            $logData = [
                'timestamp' => date('Y-m-d H:i:s'),
                'operation' => $operation,
                'duration_ms' => $duration,
                'details' => self::sanitizeForLog($details),
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true),
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            ];
            self::writeToLog('performance_issues.log', $logData);
        }
    }

    /**
     * Public static method to log API requests.
     * This method will be called by the global logApiRequest function.
     * @param string $method HTTP method (GET, POST, etc.)
     * @param string $uri Request URI
     * @param array|null $input_summary Summarized request input
     * @param mixed $response_status Response status or error message
     * @param int|string|null $userId User ID if available
     */
    public static function logApiRequest($method, $uri, $input_summary = null, $response_status = null, $userId = null) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'method' => $method,
            'uri' => $uri,
            'user_id' => self::sanitizeForLog($userId),
            'input_summary' => self::sanitizeForLog($input_summary),
            'response_status' => self::sanitizeForLog($response_status),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        self::writeToLog('api_requests.log', $logData);
    }

    /**
     * Public static method to log security events.
     * This method will be called by the global logSecurityEvent function.
     * @param string $type Type of security event (e.g., 'login_failed', 'unauthorized_access')
     * @param string $message Detailed message for the event
     * @param array|null $details Additional context or data
     */
    public static function logSecurityEvent($type, $message, $details = null) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'type' => $type,
            'message' => $message,
            'details' => self::sanitizeForLog($details),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
        ];
        self::writeToLog('security_events.log', $logData);
    }
}