<?php
// tes-koneksi.php
require_once 'config/database.php';

echo "<h1>Tes Koneksi Database</h1>";

try {
    $database = new Database();
    $db = $database->getConnection();
    echo "<p style='color:green;'>✅ Koneksi ke database <strong>'" . $database->db_name . "'</strong> berhasil!</p>";
    
    // Uji coba query sederhana
    $stmt = $db->query("SELECT name FROM users WHERE role = 'admin'");
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($admin) {
        echo "<p style='color:green;'>✅ Berhasil mengambil data admin: " . htmlspecialchars($admin['name']) . "</p>";
    } else {
        echo "<p style='color:orange;'>⚠️ Tidak dapat menemukan user admin. Pastikan Anda sudah mengimpor `schema.sql`.</p>";
    }

} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Gagal terhubung ke database: " . $e->getMessage() . "</p>";
}