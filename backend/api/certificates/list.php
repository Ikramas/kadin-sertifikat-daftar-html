<?php
// File: backend/api/certificates/list.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/app.php'; // Muat APP_BASE_URL
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Memastikan pengguna terautentikasi
    $currentUser = JWT::requireAuth();
    
    // Koneksi ke database
    $database = new Database();
    $db = $database->getConnection();
    
    // Mengambil semua sertifikat untuk pengguna ini
    $stmt = $db->prepare("
        SELECT 
            c.id, 
            c.certificate_number, 
            c.classification,    
            c.business_field,    
            c.qualification,     
            c.issued_date, 
            c.expiry_date, 
            c.status,
            c.issuer_name, 
            c.certificate_file_path, 
            c.created_at,
            a.application_number, 
            a.application_type,
            u.uuid as user_uuid
        FROM certificates c
        LEFT JOIN applications a ON c.application_id = a.id
        LEFT JOIN users u ON c.user_id = u.id -- Join ke users untuk user_uuid
        WHERE c.user_id = ?
        ORDER BY c.issued_date DESC
    ");
    $stmt->execute([$currentUser['user_id']]);
    $certificates = $stmt->fetchAll(PDO::FETCH_ASSOC); // Fetch as associative array
    
    // Kategorikan dan format sertifikat
    $activeCertificates = [];
    $expiringSoon = [];
    $expired = [];
    $inProcess = []; // Untuk sertifikat yang statusnya bukan 'active'

    $currentDate = new DateTime();
    $thirtyDaysFromNow = new DateTime('+30 days');
    
    foreach ($certificates as &$cert) { 
        // Format tanggal agar konsisten dengan frontend
        $cert['issued_date_formatted'] = $cert['issued_date'] ? date('d M Y', strtotime($cert['issued_date'])) : null;
        $cert['expiry_date_formatted'] = $cert['expiry_date'] ? date('d M Y', strtotime($cert['expiry_date'])) : null;
        $cert['created_at_formatted'] = $cert['created_at'] ? date('d M Y H:i', strtotime($cert['created_at'])) : null;

        // Tambahkan certificate_file_url yang menunjuk ke endpoint download terproteksi
        if (!empty($cert['certificate_file_path'])) {
            // Asumsi certificate_file_path adalah path relatif seperti 'sbu_files/sbu_SBU-KI-2024-00001.pdf'
            // Gunakan basename untuk mendapatkan nama file unik di server
            $cert['certificate_file_url'] = APP_BASE_URL . '/backend/api/certificates/generate_pdf.php?certificate_id=' . urlencode($cert['id']);
        } else {
            $cert['certificate_file_url'] = null;
            ErrorLogger::logSystemError('certificate_list_missing_filepath', "Certificate ID {$cert['id']} for user {$currentUser['user_id']} has empty certificate_file_path.");
        }
        
        // Logika kategorisasi status
        if ($cert['status'] === 'active' && $cert['expiry_date']) { 
            $expiryDate = new DateTime($cert['expiry_date']);
            
            if ($expiryDate < $currentDate) {
                $cert['category'] = 'expired';
                $expired[] = $cert;
            } elseif ($expiryDate <= $thirtyDaysFromNow) {
                $cert['category'] = 'expiring_soon';
                $interval = $currentDate->diff($expiryDate);
                $cert['days_until_expiry'] = $interval->days; // Jarak dalam hari
                $expiringSoon[] = $cert;
            } else {
                $cert['category'] = 'active';
                $activeCertificates[] = $cert;
            }
        } else { 
            $cert['category'] = 'in_process'; // Sertifikat dengan status selain 'active' dianggap 'in_process'
            $inProcess[] = $cert;
        }
    }
    
    // Mengambil permohonan yang masih dalam proses untuk user ini (submitted, under_review, approved)
    $stmt = $db->prepare("
        SELECT 
            a.id, a.application_number, a.application_type, a.requested_classification,
            a.business_field, a.company_qualification, a.status, a.submission_date,
            a.review_date, a.created_at, a.code_reg
        FROM applications a
        WHERE a.user_id = ? AND a.status IN ('submitted', 'under_review', 'approved')
        ORDER BY a.created_at DESC
    ");
    $stmt->execute([$currentUser['user_id']]);
    $applicationsInProgress = $stmt->fetchAll(PDO::FETCH_ASSOC); // Fetch as associative array
    
    // Format tanggal aplikasi dan tambahkan URL detail
    foreach ($applicationsInProgress as &$app) {
        $app['created_at_formatted'] = $app['created_at'] ? date('d M Y H:i', strtotime($app['created_at'])) : null;
        $app['submission_date_formatted'] = $app['submission_date'] ? date('d M Y H:i', strtotime($app['submission_date'])) : null;
        $app['review_date_formatted'] = $app['review_date'] ? date('d M Y H:i', strtotime($app['review_date'])) : null; 
        $app['application_detail_url'] = APP_BASE_URL . '/applications/' . urlencode($app['code_reg']);
    }
    
    logApiRequest('GET', '/api/certificates/list', ['user_id' => $currentUser['user_id']], [
        'success' => true, 
        'total_certificates' => count($certificates),
        'active' => count($activeCertificates),
        'expiring_soon' => count($expiringSoon),
        'expired' => count($expired),
        'in_process' => count($inProcess),
        'applications_in_progress' => count($applicationsInProgress)
    ]);
    
    ApiResponse::success([
        'certificates' => [
            'active' => $activeCertificates,
            'expiring_soon' => $expiringSoon,
            'expired' => $expired,
            'in_process' => $inProcess
        ],
        'applications_in_progress' => $applicationsInProgress,
        'summary' => [
            'total_certificates' => count($certificates),
            'active_count' => count($activeCertificates),
            'expiring_soon_count' => count($expiringSoon),
            'expired_count' => count($expired),
            'in_process_count' => count($inProcess),
            'applications_in_progress_count' => count($applicationsInProgress)
        ]
    ], 'Daftar sertifikat berhasil dimuat');
    
} catch (Exception $e) {
    ErrorLogger::logSystemError('certificate_list_fetch', $e->getMessage(), ['user_id' => $currentUser['user_id'] ?? null]);
    logApiRequest('GET', '/api/certificates/list', ['user_id' => $currentUser['user_id'] ?? null], $e->getMessage());
    ApiResponse::serverError('Gagal memuat daftar sertifikat: ' . $e->getMessage());
}