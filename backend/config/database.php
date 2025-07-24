<?php
require_once __DIR__ . '/../error_handler.php';

class Database {
    private $host = "localhost";
    private $db_name = "sbu_kadin_portal";
    private $username = "root";
    private $password = "";
    private $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]
            );
            
            logApiRequest('DATABASE', 'connection_success');
        } catch(PDOException $exception) {
            logApiRequest('DATABASE', 'connection_failed', null, $exception->getMessage());
            throw new Exception("Koneksi database gagal: " . $exception->getMessage());
        }
        
        return $this->conn;
    }
}