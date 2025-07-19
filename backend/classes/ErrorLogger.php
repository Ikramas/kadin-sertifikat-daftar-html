<?php
require_once __DIR__ . '/../error_handler.php';

class ErrorLogger {
    
    public static function logUserError($context, $userMessage, $technicalDetails = null, $userId = null) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'context' => $context,
            'user_message' => $userMessage,
            'technical_details' => $technicalDetails,
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
            'technical_details' => $technicalDetails,
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
            'query' => $query,
            'error' => $error,
            'parameters' => $parameters,
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
            'email' => $email,
            'reason' => $reason,
            'additional_data' => $additionalData,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        
        self::writeToLog('authentication_errors.log', $logData);
    }
    
    private static function writeToLog($filename, $data) {
        $logDir = __DIR__ . '/../../logs';
        
        // Create logs directory if it doesn't exist
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $logFile = $logDir . '/' . $filename;
        $logEntry = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL . "---" . PHP_EOL;
        
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    private static function sanitizeForLog($value) {
        if (is_string($value)) {
            // Don't log passwords or sensitive data
            if (stripos($value, 'password') !== false || strlen($value) > 100) {
                return '[SENSITIVE_DATA_HIDDEN]';
            }
            return $value;
        }
        return $value;
    }
    
    public static function logPerformanceIssue($operation, $duration, $details = null) {
        if ($duration > 2000) { // Log if operation takes more than 2 seconds
            $logData = [
                'timestamp' => date('Y-m-d H:i:s'),
                'operation' => $operation,
                'duration_ms' => $duration,
                'details' => $details,
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true)
            ];
            
            self::writeToLog('performance_issues.log', $logData);
        }
    }
}