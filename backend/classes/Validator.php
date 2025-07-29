<?php
// File: backend/classes/Validator.php
require_once __DIR__ . '/../error_handler.php'; 
require_once __DIR__ . '/ApiResponse.php'; 

class Validator {
    private $errors = [];
    
    public function required($field, $value, $message = null) {
        if (empty($value) && $value !== 0 && $value !== '0' && $value !== false) { 
            $this->errors[$field] = $message ?: "Field '{$field}' wajib diisi";
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
        if (!empty($value) && is_string($value) && strlen($value) < $min) {
            $this->errors[$field] = $message ?: "Field '{$field}' minimal {$min} karakter";
        }
        return $this;
    }
    
    public function maxLength($field, $value, $max, $message = null) {
        if (!empty($value) && is_string($value) && strlen($value) > $max) {
            $this->errors[$field] = $message ?: "Field '{$field}' maksimal {$max} karakter";
        }
        return $this;
    }
    
    public function numeric($field, $value, $message = null) {
        if (!empty($value) && !is_numeric($value)) {
            $this->errors[$field] = $message ?: "Field '{$field}' harus berupa angka";
        }
        return $this;
    }

    /**
     * Memvalidasi nilai minimum (numerik atau string panjang).
     * @param string $field Nama field.
     * @param mixed $value Nilai field.
     * @param float|int $min Nilai minimum yang diizinkan.
     * @param string|null $message Pesan error kustom.
     * @return $this
     */
    public function min($field, $value, $min, $message = null) {
        if (!empty($value)) {
            if (is_numeric($value)) {
                if ($value < $min) {
                    $this->errors[$field] = $message ?: "Field '{$field}' minimal {$min}";
                }
            } elseif (is_string($value)) {
                if (strlen($value) < $min) {
                    $this->errors[$field] = $message ?: "Field '{$field}' minimal {$min} karakter";
                }
            }
        }
        return $this;
    }

    public function date($field, $value, $format = 'Y-m-d', $message = null) {
        if (!empty($value)) {
            $d = DateTime::createFromFormat($format, $value);
            if (!($d && $d->format($format) === $value)) {
                $this->errors[$field] = $message ?: "Format tanggal untuk field '{$field}' tidak valid (format: {$format})";
            }
        }
        return $this;
    }
    
    public function npwp($field, $value, $message = null) {
        if (!empty($value)) {
            $cleanValue = preg_replace('/[^0-9]/', '', $value);
            if (strlen($cleanValue) !== 15) {
                $this->errors[$field] = $message ?: "Format NPWP tidak valid (harus 15 digit angka)";
            }
            if (!preg_match('/^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/', $value)) {
                $this->errors[$field] = $message ?: "Format NPWP tidak valid (contoh: XX.XXX.XXX.X-XXX.XXX)";
            }
        }
        return $this;
    }
    
    public function nib($field, $value, $message = null) {
        if (!empty($value)) {
            $cleanValue = preg_replace('/[^0-9]/', '', $value);
            if (strlen($cleanValue) !== 13) { 
                $this->errors[$field] = $message ?: "Format NIB tidak valid (harus 13 digit angka)";
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
            } elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).*$/', $value)) {
                $this->errors[$field] = $message ?: "Password harus mengandung huruf besar, huruf kecil, angka, dan simbol";
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
            $this->errors[$field] = $message ?: "Field '{$field}' tidak valid";
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
}