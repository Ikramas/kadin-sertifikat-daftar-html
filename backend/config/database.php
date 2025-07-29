<?php
// File: backend/config/database.php
require_once __DIR__ . '/../error_handler.php';
class Database {
    private $host = "localhost";
    private $db_name = "sbu_kadin_portal";
    private $username = "root";
    private $password = ""; // Ganti dengan password database Anda
    public $conn;

    // Mendapatkan koneksi database
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Aktifkan mode error exceptions
        } catch(PDOException $exception) {
            error_log("Database connection error: " . $exception->getMessage());
            // Di sini Anda bisa memanggil ErrorLogger::logDatabaseError
            // ErrorLogger::logDatabaseError('connection', 'N/A', $exception->getMessage());
            ApiResponse::serverError("Koneksi database gagal: " . $exception->getMessage());
        }

        return $this->conn;
    }
}

// Contoh untuk mengakses koneksi secara langsung di beberapa skrip lama
// function getDbConnection() {
//     $database = new Database();
//     return $database->getConnection();
// }
?>