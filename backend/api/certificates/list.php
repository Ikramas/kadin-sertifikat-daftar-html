<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';

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
    // Mengambil kolom classification, business_field, qualification dari tabel certificates (alias c)
    $stmt = $db->prepare("
        SELECT 
            c.id, 
            c.certificate_number, 
            c.classification,    -- Diambil langsung dari tabel certificates
            c.business_field,    -- Diambil langsung dari tabel certificates
            c.qualification,     -- Diambil langsung dari tabel certificates
            c.issued_date, 
            c.expiry_date, 
            c.status,
            c.issuer_name, 
            c.certificate_file_path, 
            c.created_at,
            a.application_number, 
            a.application_type
        FROM certificates c
        LEFT JOIN applications a ON c.application_id = a.id
        WHERE c.user_id = ?
        ORDER BY c.issued_date DESC
    ");
    $stmt->execute([$currentUser['user_id']]);
    $certificates = $stmt->fetchAll();
    
    // Kategorikan dan format sertifikat
    $activeCertificates = [];
    $expiringSoon = [];
    $expired = [];
    $inProcess = [];
    
    $currentDate = new DateTime();
    $thirtyDaysFromNow = new DateTime('+30 days');
    
    foreach ($certificates as &$cert) { // Menggunakan & untuk memodifikasi array asli
        // Format tanggal
        $cert['issued_date_formatted'] = $cert['issued_date'] ? date('d/m/Y', strtotime($cert['issued_date'])) : null;
        $cert['expiry_date_formatted'] = $cert['expiry_date'] ? date('d/m/Y', strtotime($cert['expiry_date'])) : null;
        $cert['created_at_formatted'] = $cert['created_at'] ? date('d/m/Y H:i', strtotime($cert['created_at'])) : null;

        // Tambahkan certificate_file_url
        if (!empty($cert['certificate_file_path'])) {
            $cert['certificate_file_url'] = '/backend/api/documents/download.php?file_name=' . urlencode(basename($cert['certificate_file_path']));
        } else {
            $cert['certificate_file_url'] = null;
        }
        
        if ($cert['expiry_date']) {
            $expiryDate = new DateTime($cert['expiry_date']);
            
            if ($cert['status'] === 'active') { 
                if ($expiryDate < $currentDate) {
                    $cert['category'] = 'expired';
                    $expired[] = $cert;
                } elseif ($expiryDate <= $thirtyDaysFromNow) {
                    $cert['category'] = 'expiring_soon';
                    $cert['days_until_expiry'] = $currentDate->diff($expiryDate)->days;
                    $expiringSoon[] = $cert;
                } else {
                    $cert['category'] = 'active';
                    $activeCertificates[] = $cert;
                }
            } else { 
                $cert['category'] = 'in_process';
                $inProcess[] = $cert;
            }
        } else { 
            $cert['category'] = 'in_process';
            $inProcess[] = $cert;
        }
    }
    
    // Mengambil permohonan yang masih dalam proses
    $stmt = $db->prepare("
        SELECT 
            a.id, a.application_number, a.application_type, a.requested_classification,
            a.business_field, a.company_qualification, a.status, a.submission_date,
            a.review_date, a.created_at
        FROM applications a
        WHERE a.user_id = ? AND a.status IN ('submitted', 'under_review', 'approved')
        ORDER BY a.created_at DESC
    ");
    $stmt->execute([$currentUser['user_id']]);
    $applicationsInProgress = $stmt->fetchAll();
    
    // Format tanggal aplikasi
    foreach ($applicationsInProgress as &$app) {
        $app['created_at_formatted'] = $app['created_at'] ? date('d/m/Y H:i', strtotime($app['created_at'])) : null;
        $app['submission_date_formatted'] = $app['submission_date'] ? date('d/m/Y H:i', strtotime($app['submission_date'])) : null;
        $app['review_date_formatted'] = $app['review_date'] ? date('d/m/Y H:i', strtotime($app['review_date'])) : null; 
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
    logApiRequest('GET', '/api/certificates/list', ['user_id' => $currentUser['user_id'] ?? null], $e->getMessage());
    ApiResponse::serverError('Gagal memuat daftar sertifikat: ' . $e->getMessage());
}