-- BSKI Portal Database Schema
-- Created for SBU Kadin Indonesia Portal

-- Create database (run this manually first)
-- CREATE DATABASE sbu_kadin_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE sbu_kadin_portal;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('pending_verification', 'pending_document_verification', 'pending_admin_approval', 'active', 'verified', 'suspended') DEFAULT 'pending_verification',
    role ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- Companies table
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    business_entity_type ENUM('PT', 'CV', 'Firma', 'Koperasi', 'Perorangan', 'Lainnya') NOT NULL,
    npwp VARCHAR(20) NOT NULL,
    nib VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    province VARCHAR(100) NOT NULL,
    regency_city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    village VARCHAR(100) NOT NULL,
    company_phone VARCHAR(20) NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    business_type VARCHAR(255) NOT NULL,
    investment_value BIGINT NOT NULL,
    employee_count INT NOT NULL,
    leader_name VARCHAR(255) NOT NULL,
    leader_position VARCHAR(100) NOT NULL,
    leader_nik VARCHAR(20) NOT NULL,
    leader_npwp VARCHAR(20) NOT NULL,
    kta_kadin_number VARCHAR(50) NOT NULL,
    kta_date DATE NOT NULL,
    status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- OTPs table
CREATE TABLE otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_expires_at (expires_at)
);

-- Documents table
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    document_type ENUM(
        'kta_kadin_terakhir', 
        'nib', 
        'akta_pendirian', 
        'akta_perubahan', 
        'npwp_perusahaan', 
        'sk_kemenkumham', 
        'ktp_pimpinan', 
        'npwp_pimpinan', 
        'pasfoto_pimpinan',
        'sbu_certificate',
        'other'
    ) NOT NULL,
    category ENUM('initial_registration', 'sbu_application', 'renewal', 'other') DEFAULT 'initial_registration',
    status ENUM('uploaded', 'verified', 'rejected') DEFAULT 'uploaded',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    notes TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_document_type (document_type),
    INDEX idx_category (category),
    INDEX idx_status (status)
);

-- Applications table (for SBU applications)
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    application_number VARCHAR(50) NOT NULL UNIQUE,
    application_type ENUM('new', 'renewal', 'upgrade') NOT NULL,
    current_sbu_number VARCHAR(50) NULL,
    requested_classification VARCHAR(255) NOT NULL,
    business_field VARCHAR(255) NOT NULL,
    company_qualification ENUM('Kecil', 'Menengah', 'Besar') NOT NULL,
    status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'completed') DEFAULT 'draft',
    submission_date TIMESTAMP NULL,
    review_date TIMESTAMP NULL,
    completion_date TIMESTAMP NULL,
    reviewer_id INT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_application_number (application_number),
    INDEX idx_status (status),
    INDEX idx_application_type (application_type)
);

-- Required documents table
CREATE TABLE required_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_type ENUM('initial_registration', 'new_sbu', 'renewal_sbu', 'upgrade_sbu') NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    description TEXT NULL,
    max_file_size INT DEFAULT 5242880, -- 5MB in bytes
    allowed_formats VARCHAR(100) DEFAULT 'pdf,jpg,jpeg,png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_application_type (application_type)
);

-- Application documents junction table
CREATE TABLE application_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    document_id INT NOT NULL,
    required_document_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (required_document_id) REFERENCES required_documents(id) ON DELETE CASCADE,
    UNIQUE KEY unique_app_req_doc (application_id, required_document_id),
    INDEX idx_application_id (application_id)
);

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_type ENUM('application', 'document', 'system') NULL,
    related_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- Transactions table (for payment tracking)
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    application_id INT NULL,
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'paid', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_method ENUM('bank_transfer', 'credit_card', 'e_wallet', 'other') NULL,
    payment_reference VARCHAR(255) NULL,
    paid_at TIMESTAMP NULL,
    expired_at TIMESTAMP NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_number (transaction_number),
    INDEX idx_status (status)
);

-- Settings table
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
);

-- Insert default required documents for initial registration
INSERT INTO required_documents (application_type, document_type, document_name, is_required, description) VALUES
('initial_registration', 'kta_kadin_terakhir', 'KTA Kadin Terakhir', TRUE, 'Kartu Tanda Anggota Kadin yang masih berlaku'),
('initial_registration', 'nib', 'NIB (Nomor Induk Berusaha)', TRUE, 'Nomor Induk Berusaha dari OSS'),
('initial_registration', 'akta_pendirian', 'Akta Pendirian', TRUE, 'Akta pendirian perusahaan'),
('initial_registration', 'akta_perubahan', 'Akta Perubahan', FALSE, 'Akta perubahan (jika ada)'),
('initial_registration', 'npwp_perusahaan', 'NPWP Perusahaan', TRUE, 'NPWP atas nama perusahaan'),
('initial_registration', 'sk_kemenkumham', 'SK Kemenkumham', TRUE, 'Surat Keputusan dari Kemenkumham yang memuat tabel modal penetapan'),
('initial_registration', 'ktp_pimpinan', 'KTP Pimpinan', TRUE, 'Kartu Tanda Penduduk pimpinan perusahaan'),
('initial_registration', 'npwp_pimpinan', 'NPWP Pimpinan', TRUE, 'NPWP atas nama pimpinan perusahaan'),
('initial_registration', 'pasfoto_pimpinan', 'Pasfoto Pimpinan', TRUE, 'Foto pimpinan perusahaan');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('app_name', 'BSKI Portal', 'Nama aplikasi'),
('app_version', '1.0.0', 'Versi aplikasi'),
('otp_expiry_minutes', '10', 'Durasi berlaku OTP dalam menit'),
('max_file_size_mb', '5', 'Ukuran maksimal file upload dalam MB'),
('allowed_file_types', 'pdf,jpg,jpeg,png', 'Tipe file yang diizinkan untuk upload'),
('maintenance_mode', 'false', 'Mode maintenance aplikasi'),
('registration_enabled', 'true', 'Apakah pendaftaran pengguna baru diaktifkan'),
('email_verification_required', 'true', 'Apakah verifikasi email diperlukan');

-- Create admin user (password: Admin123!)
INSERT INTO users (name, email, phone, password, status, role, email_verified_at) VALUES
('Administrator', 'admin@bski-portal.com', '08123456789', '$argon2id$v=19$m=65536,t=4,p=3$YWJjZGVmZ2hpams$h9pH8oQl9HjVw4Q4f4L2dQzN7HZsj6xgH1B1dQwM7nI', 'active', 'admin', NOW());