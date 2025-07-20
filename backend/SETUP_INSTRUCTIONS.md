# SETUP INSTRUKSI BSKI PORTAL

## 📋 PRASYARAT SISTEM

### 1. XAMPP Installation
- Download XAMPP dari: https://www.apachefriends.org/
- Install dengan PHP 8.1+ dan MySQL 5.7+
- Pastikan Apache dan MySQL berjalan

### 2. Database Setup
```sql
-- 1. Buka phpMyAdmin (http://localhost/phpmyadmin)
-- 2. Buat database baru
CREATE DATABASE sbu_kadin_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Import schema
USE sbu_kadin_portal;
-- Kemudian jalankan file database/schema.sql
```

### 3. Composer Installation
```bash
# Install Composer dari: https://getcomposer.org/
# Kemudian install dependencies
cd backend
composer install
```

### 4. File Structure
```
backend/
├── api/
│   ├── auth/
│   │   ├── login.php
│   │   ├── register.php
│   │   ├── verify-otp.php
│   │   ├── resend-otp.php
│   │   └── csrf-token.php
│   └── ...
├── classes/
│   ├── Database.php
│   ├── JWT.php
│   ├── CSRFProtection.php
│   ├── SecurityManager.php
│   ├── Validator.php
│   ├── OTPManager.php
│   ├── ApiResponse.php
│   └── ErrorLogger.php
├── config/
│   ├── database.php
│   └── cors.php
├── logs/ (akan dibuat otomatis)
│   ├── api_requests.log
│   ├── security_events.log
│   ├── php_errors.log
│   ├── user_errors.log
│   ├── system_errors.log
│   ├── database_errors.log
│   ├── validation_errors.log
│   ├── authentication_errors.log
│   └── performance_issues.log
└── database/
    └── schema.sql
```

## 🔧 KONFIGURASI

### 1. Database Configuration (config/database.php)
```php
class Database {
    private $host = "localhost";           // XAMPP default
    private $db_name = "sbu_kadin_portal"; // Nama database
    private $username = "root";            // XAMPP default
    private $password = "";                // XAMPP default (kosong)
    // ... rest of the class
}
```

### 2. Email Configuration (classes/OTPManager.php)
```php
// Update email settings untuk production:
$mail->Username   = 'your_email@gmail.com';    // Ganti dengan email Anda
$mail->Password   = 'your_app_password';        // Ganti dengan app password Gmail
```

### 3. JWT Secret (classes/JWT.php)
```php
// PENTING: Ganti secret key untuk production!
private static $secret = 'your-very-secure-secret-key-change-in-production';
```

## 🚀 TESTING

### 1. Test Database Connection
```bash
# Akses: http://localhost/backend/config/database.php
# Harus menampilkan koneksi berhasil
```

### 2. Test API Endpoints
```bash
# Get CSRF Token
curl -X GET http://localhost/backend/api/auth/csrf-token.php

# Test Registration
curl -X POST http://localhost/backend/api/auth/register.php \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: [token_from_previous_request]" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "08123456789",
    "password": "Test123!",
    "confirmPassword": "Test123!",
    "companyName": "PT Test",
    "npwp": "12.345.678.9-123.456",
    "nib": "1234567890123",
    "address": "Jl. Test No. 123",
    "city": "Jakarta",
    "postalCode": "12345",
    "companyPhone": "02112345678",
    "companyEmail": "company@test.com",
    "businessType": "teknologi",
    "investmentValue": "1000000000",
    "employeeCount": "50",
    "termsAccepted": true,
    "csrf_token": "[same_token]"
  }'
```

## 📊 MONITORING LOGS

### 1. Error Logs Location
```
backend/logs/
├── php_errors.log          # PHP runtime errors
├── api_requests.log        # All API requests & responses
├── security_events.log     # Security-related events
├── user_errors.log         # User-friendly error messages
├── system_errors.log       # System/server errors
├── database_errors.log     # Database-related errors
├── validation_errors.log   # Form validation errors
├── authentication_errors.log # Login/auth errors
└── performance_issues.log  # Slow queries/operations
```

### 2. Log Format
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "context": "registration",
  "message": "User registration failed",
  "technical_details": "Email already exists",
  "user_id": null,
  "ip_address": "127.0.0.1",
  "request_uri": "/backend/api/auth/register.php"
}
```

## 🔒 SECURITY FEATURES

### 1. CSRF Protection
- ✅ Token-based CSRF protection
- ✅ Header and body validation
- ✅ Session-based token storage

### 2. JWT Implementation
- ✅ HS256 algorithm
- ✅ Token expiration (1 hour default)
- ✅ Token blacklist support
- ✅ Secure payload validation

### 3. Rate Limiting
- ✅ Login attempt limiting (5 attempts/5 minutes)
- ✅ OTP request limiting (3 requests/15 minutes)
- ✅ IP-based brute force protection

### 4. Input Validation
- ✅ Comprehensive validation rules
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ File upload security

### 5. Password Security
- ✅ Argon2ID hashing
- ✅ Strong password requirements
- ✅ Password confirmation

## 🛠️ TROUBLESHOOTING

### 1. Database Connection Issues
```
Error: "Koneksi database gagal"
Solution: 
- Pastikan MySQL berjalan di XAMPP
- Periksa nama database: sbu_kadin_portal
- Periksa kredensial: root / (kosong)
```

### 2. Email OTP Issues
```
Error: "Gagal mengirim email OTP"
Solution:
- Update email credentials di OTPManager.php
- Pastikan Gmail App Password digunakan
- Periksa firewall/antivirus
```

### 3. Permission Issues
```
Error: "Failed to write to logs"
Solution:
- Buat folder logs/ manual
- Set permissions: chmod 755 logs/
- Pastikan web server bisa write
```

### 4. CORS Issues
```
Error: "CORS policy blocked"
Solution:
- Periksa config/cors.php
- Update allowed origins
- Pastikan headers ter-set correct
```

## 📞 SUPPORT

Jika mengalami masalah:
1. Periksa logs di folder `backend/logs/`
2. Pastikan semua prasyarat terpenuhi
3. Test dengan curl commands
4. Periksa PHP error logs di XAMPP

**SEMUA ERROR OTOMATIS TERCATAT DI FOLDER LOGS UNTUK DEBUGGING!**
