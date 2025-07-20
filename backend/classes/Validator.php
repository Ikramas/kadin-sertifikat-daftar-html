<?php
require_once __DIR__ . '/../error_handler.php';

class Validator {
    private $errors = [];
    
    public function required($field, $value, $message = null) {
        if (empty($value) || (is_string($value) && trim($value) === '')) {
            $this->errors[$field] = $message ?: "Field {$field} wajib diisi";
        }
        return $this;
    }
    
    public function email($field, $value, $message = null) {
        if (!empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = $message ?: "Format email tidak valid";
        }
        return $this;
    }
    
    public function minLength($field, $value, $min, $message = null) {
        if (!empty($value) && strlen($value) < $min) {
            $this->errors[$field] = $message ?: "Field {$field} minimal {$min} karakter";
        }
        return $this;
    }
    
    public function maxLength($field, $value, $max, $message = null) {
        if (!empty($value) && strlen($value) > $max) {
            $this->errors[$field] = $message ?: "Field {$field} maksimal {$max} karakter";
        }
        return $this;
    }
    
    public function numeric($field, $value, $message = null) {
        if (!empty($value) && !is_numeric($value)) {
            $this->errors[$field] = $message ?: "Field {$field} harus berupa angka";
        }
        return $this;
    }
    
    public function npwp($field, $value, $message = null) {
        if (!empty($value)) {
            // Remove formatting
            $cleanValue = preg_replace('/[^0-9]/', '', $value);
            if (strlen($cleanValue) !== 15) {
                $this->errors[$field] = $message ?: "NPWP harus 15 digit";
            }
        }
        return $this;
    }
    
    public function nib($field, $value, $message = null) {
        if (!empty($value)) {
            $cleanValue = preg_replace('/[^0-9]/', '', $value);
            if (strlen($cleanValue) < 10 || strlen($cleanValue) > 13) {
                $this->errors[$field] = $message ?: "NIB harus 10-13 digit";
            }
        }
        return $this;
    }
    
    public function phone($field, $value, $message = null) {
        if (!empty($value)) {
            $cleanValue = preg_replace('/[^0-9]/', '', $value);
            if (strlen($cleanValue) < 8 || strlen($cleanValue) > 15) {
                $this->errors[$field] = $message ?: "Nomor telepon harus 8-15 digit";
            }
        }
        return $this;
    }
    
    public function password($field, $value, $message = null) {
        if (!empty($value)) {
            if (strlen($value) < 8) {
                $this->errors[$field] = $message ?: "Password minimal 8 karakter";
            } elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $value)) {
                $this->errors[$field] = $message ?: "Password harus mengandung huruf besar, huruf kecil, dan angka";
            }
        }
        return $this;
    }
    
    public function match($field, $value, $confirmValue, $message = null) {
        if ($value !== $confirmValue) {
            $this->errors[$field] = $message ?: "Konfirmasi password tidak cocok";
        }
        return $this;
    }
    
    public function custom($field, $value, $callback, $message = null) {
        if (!$callback($value)) {
            $this->errors[$field] = $message ?: "Field {$field} tidak valid";
        }
        return $this;
    }
    
    public function fails() {
        return !empty($this->errors);
    }
    
    public function errors() {
        return $this->errors;
    }
    
    public function validate() {
        if ($this->fails()) {
            ApiResponse::validation($this->errors);
        }
        return true;
    }
    
    public static function sanitize($input) {
        if (is_string($input)) {
            return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
        }
        if (is_array($input)) {
            return array_map([self::class, 'sanitize'], $input);
        }
        return $input;
    }
}