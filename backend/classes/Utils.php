<?php
// File: backend/classes/Utils.php

class Utils {
    /**
     * Menghasilkan UUID versi 4 (Universally Unique Identifier).
     * Sesuai dengan RFC 4122.
     * @return string UUID v4
     */
    public static function generateUuidV4() {
        return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand( 0, 0xffff ),
            mt_rand( 0, 0xffff ),
            mt_rand( 0, 0xffff ),
            mt_rand( 0, 0x0fff ) | 0x4000,
            mt_rand( 0, 0x3fff ) | 0x8000,
            mt_rand( 0, 0xffff ),
            mt_rand( 0, 0xffff ),
            mt_rand( 0, 0xffff )
        );
    }

    /**
     * Menghasilkan kode unik dengan prefix dan jumlah digit tertentu.
     * Memeriksa keunikan di tabel database yang diberikan.
     * Menggunakan uniqid() dan microtime() untuk keacakan yang lebih baik.
     * @param string $prefix Prefix kode (misal: 'TRX-', 'SP-')
     * @param int $numDigits Jumlah digit numerik setelah prefix
     * @param PDO $db Objek PDO database
     * @param string $tableName Nama tabel untuk memeriksa keunikan (misal: 'transactions', 'applications')
     * @param string $columnName Nama kolom untuk memeriksa keunikan (misal: 'transaction_number', 'code_reg')
     * @return string Kode unik yang dihasilkan
     * @throws Exception Jika gagal menghasilkan kode unik setelah beberapa upaya
     */
    public static function generateUniqueCode($prefix, $numDigits, $db, $tableName, $columnName) {
        $code = '';
        $isUnique = false;
        $attempts = 0;
        $maxAttempts = 100; // Batasi upaya untuk menghindari loop tak terbatas

        while (!$isUnique && $attempts < $maxAttempts) {
            // Menggunakan microtime dan uniqid untuk seed yang lebih baik
            // dan SHA1 untuk keunikan yang lebih tinggi
            $randomPart = sha1(uniqid(microtime(true), true));
            // Ambil hanya bagian numerik dari hash dan pad sesuai numDigits
            $numericPart = substr(preg_replace('/[^0-9]/', '', $randomPart), 0, $numDigits);
            // Pastikan panjangnya sesuai
            $numericPart = str_pad($numericPart, $numDigits, '0', STR_PAD_LEFT);
            
            $code = $prefix . $numericPart;

            // Perbaikan: Pastikan query memeriksa keunikan di tableName dan columnName yang BENAR
            $stmtCheck = $db->prepare("SELECT COUNT(*) FROM `{$tableName}` WHERE `{$columnName}` = ?");
            $stmtCheck->execute([$code]);
            if ($stmtCheck->fetchColumn() == 0) {
                $isUnique = true;
            }
            $attempts++;
        }

        if (!$isUnique) {
            ErrorLogger::logSystemError('unique_code_generation_failed', "Failed to generate unique code for {$tableName}.{$columnName} after multiple attempts.");
            throw new Exception("Gagal membuat kode unik setelah beberapa upaya. Silakan coba lagi.");
        }
        return $code;
    }

    /**
     * Menghasilkan nomor sertifikat unik dengan format KADIN.
     * @param PDO $db Objek PDO database
     * @return string Nomor sertifikat unik
     * @throws Exception Jika gagal menghasilkan nomor sertifikat unik setelah beberapa upaya
     */
    public static function generateUniqueCertificateNumber($db) {
        $prefix = 'SBU-KI-'; 
        $year = date('Y');
        $maxAttempts = 100; 

        for ($i = 0; $i < $maxAttempts; $i++) {
            $randomNumber = str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT); 
            $certNumber = $prefix . $year . '-' . $randomNumber;

            $stmt = $db->prepare("SELECT COUNT(*) FROM certificates WHERE certificate_number = ?");
            $stmt->execute([$certNumber]);
            if ($stmt->fetchColumn() == 0) {
                return $certNumber;
            }
        }
        ErrorLogger::logSystemError('certificate_generation', 'Failed to generate unique certificate number after multiple attempts.');
        throw new Exception("Gagal membuat nomor sertifikat unik setelah beberapa upaya.");
    }

    /**
     * Menghasilkan Nomor Registrasi Nasional (NRN).
     * @param PDO $db Objek PDO database
     * @return string NRN unik
     * @throws Exception Jika gagal menghasilkan NRN unik setelah beberapa upaya
     */
    public static function generateNationalRegNumber($db) {
        $prefix = 'NRN-';
        $maxAttempts = 100;

        for ($i = 0; $i < $maxAttempts; $i++) {
            // Menggunakan uniqid dan md5 untuk keunikan yang lebih tinggi
            $uniqueNrn = $prefix . date('Ymd') . '-' . substr(md5(uniqid(microtime(true), true)), 0, 8); 
            $stmt = $db->prepare("SELECT COUNT(*) FROM certificates WHERE national_reg_number = ?");
            $stmt->execute([$uniqueNrn]);
            if ($stmt->fetchColumn() == 0) {
                return $uniqueNrn;
            }
        }
        ErrorLogger::logSystemError('nrn_generation_failed', 'Failed to generate unique National Registration Number after multiple attempts.');
        throw new Exception("Gagal membuat Nomor Registrasi Nasional unik setelah beberapa upaya.");
    }
}