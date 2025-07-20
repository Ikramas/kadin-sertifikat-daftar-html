<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/JWT.php';

// Fungsi untuk menghasilkan UUID v4 (opsional, jika Anda menggunakan UUID di user table)
if (!function_exists('generateUuidV4')) {
    function generateUuidV4() {
        return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
            mt_rand( 0, 0xffff ),
            mt_rand( 0, 0x0fff ) | 0x4000,
            mt_rand( 0, 0x3fff ) | 0x8000,
            mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
        );
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Memerlukan autentikasi pengguna
    $currentUser = JWT::requireAuth();
    
    // Memvalidasi token CSRF
    CSRFProtection::requireValidToken();
    
    // Memeriksa status user: hanya user 'active' atau 'verified' yang bisa mengajukan SBU
    if (!in_array($currentUser['status'], ['active', 'verified'])) {
        ApiResponse::forbidden('Anda belum dapat mengajukan SBU. Silakan lengkapi dokumen registrasi terlebih dahulu.');
    }
    
    // Mengambil input JSON
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid');
    }
    
    // Melakukan sanitasi input
    $input = SecurityManager::sanitizeInput($input);
    
    // Mengekstrak data dari request (sesuai nama field dari form React Hook Form)
    $applicationType = $input['applicationType'] ?? ''; 
    $currentSbuNumber = $input['currentSbuNumber'] ?? null; 
    $businessField = $input['businessField'] ?? ''; 
    $companyQualification = $input['companyQualification'] ?? ''; 
    $notes = $input['notes'] ?? null; 
    
    // Bidang NPWP/NIB yang diambil otomatis dari profil perusahaan
    $npwpPerusahaan = $input['npwp'] ?? '';
    $npwpPimpinan = $input['leader_npwp'] ?? '';
    $nib = $input['nib'] ?? '';

    // Bidang legalitas dan kompetensi baru dari formulir
    $aktaPendirianNotaris = $input['aktaPendirianNotaris'] ?? null;
    $aktaPendirianNomor = $input['aktaPendirianNomor'] ?? null;
    $aktaPendirianTanggal = $input['aktaPendirianTanggal'] ?? null; 
    $aktaPerubahanNotaris = $input['aktaPerubahanNotaris'] ?? null;
    $aktaPerubahanNomor = $input['aktaPerubahanNomor'] ?? null;
    $aktaPerubahanTanggal = $input['aktaPerubahanTanggal'] ?? null; 
    $skKemenkumhamNomorTanggal = $input['skKemenkumhamNomorTanggal'] ?? null;
    $nibDate = $input['nibDate'] ?? null; 
    $kodeSubbidang = $input['kodeSubbidang'] ?? null; 
    $bidangName = $input['bidangName'] ?? null;     

    // ID dokumen yang di-upload bersamaan dengan form SBU
    $uploadedSbuDocumentIds = $input['uploaded_documents_sbu'] ?? []; 

    // Melakukan validasi input
    $validator = new Validator();
    $validator
        ->required('applicationType', $applicationType, 'Jenis permohonan wajib dipilih')
        ->custom('applicationType', $applicationType, function($value) {
            return in_array($value, ['new', 'renewal', 'upgrade']);
        }, 'Jenis permohonan tidak valid')
        // PERBAIKAN: HAPUS VALIDASI requestedClassification DARI SINI
        // Karena di frontend sudah tidak ada input terpisah untuk ini, 
        // dan kita akan menggunakan `businessField` sebagai nilai untuk kolom `requested_classification` di DB.
        ->required('businessField', $businessField, 'Bidang usaha wajib diisi') // PASTI KAN INI ADA
        ->required('companyQualification', $companyQualification, 'Kualifikasi perusahaan wajib dipilih')
        ->custom('companyQualification', $companyQualification, function($value) {
            return in_array($value, ['Kecil', 'Menengah', 'Besar']);
        }, 'Kualifikasi perusahaan tidak valid');
    
    if (in_array($applicationType, ['renewal', 'upgrade'])) {
        $validator->required('currentSbuNumber', $currentSbuNumber, 'Nomor SBU saat ini wajib diisi untuk perpanjangan/upgrade');
    }

    // Validasi Bidang Legalitas & Kompetensi Baru
    $validator
        ->required('aktaPendirianNotaris', $aktaPendirianNotaris, 'Nama Notaris Akta Pendirian wajib diisi')
        ->required('aktaPendirianNomor', $aktaPendirianNomor, 'Nomor Akta Pendirian wajib diisi')
        ->required('aktaPendirianTanggal', $aktaPendirianTanggal, 'Tanggal Pendirian wajib diisi');
        if (!empty($aktaPendirianTanggal) && !DateTime::createFromFormat('Y-m-d', $aktaPendirianTanggal)) {
             ApiResponse::error('Format Tanggal Pendirian tidak valid (YYYY-MM-DD)', 422, ['aktaPendirianTanggal' => 'Format tanggal tidak valid']);
        }
    
    if (!empty($aktaPerubahanTanggal) && !DateTime::createFromFormat('Y-m-d', $aktaPerubahanTanggal)) {
        ApiResponse::error('Format Tanggal Perubahan tidak valid (YYYY-MM-DD)', 422, ['aktaPerubahanTanggal' => 'Format tanggal tidak valid']);
    }

    $validator->required('skKemenkumhamNomorTanggal', $skKemenkumhamNomorTanggal, 'Nomor/Tanggal SK Kemenkumham wajib diisi');
    $validator->required('nibDate', $nibDate, 'Tanggal NIB wajib diisi');
        if (!empty($nibDate) && !DateTime::createFromFormat('Y-m-d', $nibDate)) {
             ApiResponse::error('Format Tanggal NIB tidak valid (YYYY-MM-DD)', 422, ['nibDate' => 'Format tanggal tidak valid']);
        }
    
    $validator->required('kodeSubbidang', $kodeSubbidang, 'Kode Subbidang wajib diisi');
    $validator->required('bidangName', $bidangName, 'Nama Bidang Usaha wajib diisi'); 

    // Validasi NPWP/NIB dari profil perusahaan (otomatis)
    $validator
        ->required('npwp', $npwpPerusahaan, 'NPWP Perusahaan tidak ditemukan di profil')
        ->required('leader_npwp', $npwpPimpinan, 'NPWP Pimpinan tidak ditemukan di profil')
        ->required('nib', $nib, 'NIB tidak ditemukan di profil');

    $validator->validate(); 
    
    // Koneksi ke database
    $database = new Database();
    $db = $database->getConnection();
    
    // Mendapatkan data perusahaan user
    $stmt = $db->prepare("SELECT id, status FROM companies WHERE user_id = ?");
    $stmt->execute([$currentUser['user_id']]);
    $company = $stmt->fetch();
    
    if (!$company || $company['status'] !== 'verified') {
        ApiResponse::error('Data perusahaan belum terverifikasi atau tidak ditemukan. Silakan hubungi administrator.');
    }
    
    // Menghasilkan nomor aplikasi yang unik
    $currentYear = date('Y');
    $stmt = $db->prepare("SELECT COUNT(*) FROM applications WHERE YEAR(created_at) = ?");
    $stmt->execute([$currentYear]);
    $count = $stmt->fetchColumn() + 1;
    $applicationNumber = 'SBU-' . $currentYear . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    
    // Memulai transaksi database
    $db->beginTransaction();
    
    try {
        // Memasukkan aplikasi ke database (TERMASUK BIDANG-BIDANG BARU)
        $stmt = $db->prepare("
            INSERT INTO applications (
                user_id, company_id, application_number, application_type, 
                current_sbu_number, requested_classification, business_field, 
                company_qualification, notes, 
                
                -- Kolom baru yang ditambahkan ke tabel applications (PASTIKAN NAMA KOLOM SESUAI DB ANDA)
                akta_pendirian_notaris, akta_pendirian_nomor, akta_pendirian_tanggal,
                akta_perubahan_notaris, akta_perubahan_nomor, akta_perubahan_tanggal,
                sk_kemenkumham_nomor_tanggal, nib_date, sub_bidang_code, bidang_name,
                npwp_perusahaan, npwp_pimpinan, nib_perusahaan,

                status, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?,
                'draft', NOW()
            )
        ");
        $stmt->execute([
            $currentUser['user_id'], 
            $company['id'], 
            $applicationNumber, 
            $applicationType, 
            $currentSbuNumber, 
            $businessField, // <--- MENGGUNAKAN $businessField UNTUK requested_classification di DB
            $businessField, // <--- MENGGUNAKAN $businessField UNTUK business_field di DB (jika keduanya sama)
            $companyQualification, 
            $notes,
            // Nilai untuk kolom baru (pastikan urutan sesuai dengan kolom di atas)
            $aktaPendirianNotaris, $aktaPendirianNomor, $aktaPendirianTanggal,
            $aktaPerubahanNotaris, $aktaPerubahanNomor, $aktaPerubahanTanggal,
            $skKemenkumhamNomorTanggal, $nibDate, $kodeSubbidang, $bidangName,
            // Nilai NPWP/NIB dari profil perusahaan (otomatis)
            $npwpPerusahaan, $npwpPimpinan, $nib
        ]);
        
        $applicationId = $db->lastInsertId();
        
        // Mengaitkan dokumen yang diunggah dengan permohonan SBU
        if (!empty($uploadedSbuDocumentIds)) { 
            $placeholders = str_repeat('?,', count($uploadedSbuDocumentIds) - 1) . '?';
            $stmt = $db->prepare("SELECT id FROM documents WHERE id IN ($placeholders) AND user_id = ?");
            $stmt->execute(array_merge($uploadedSbuDocumentIds, [$currentUser['user_id']]));
            $verifiedDocumentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($verifiedDocumentIds as $documentId) {
                $stmt = $db->prepare("
                    UPDATE documents SET 
                        category = 'sbu_application', 
                        related_application_id = ?
                    WHERE id = ? AND user_id = ?
                ");
                $stmt->execute([$applicationId, $documentId, $currentUser['user_id']]);
            }
        }
        
        // Membuat notifikasi untuk admin
        $stmt = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id, created_at)
            SELECT id, 'Permohonan SBU Baru', 
                   CONCAT('Pengguna ', ?, ' telah mengirim permohonan SBU dengan nomor ', ?, ' dalam status draft.'),
                   'info', 'application', ?, NOW()
            FROM users WHERE role IN ('admin', 'super_admin')
        ");
        $stmt->execute([$currentUser['name'], $applicationNumber, $applicationId]); 
        
        // Commit transaksi
        $db->commit();
        
        logApiRequest('POST', '/api/applications/create', [
            'user_id' => $currentUser['user_id'],
            'application_type' => $applicationType,
            'application_number' => $applicationNumber
        ], ['success' => true, 'application_id' => $applicationId]);
        
        ApiResponse::success([
            'application_id' => $applicationId,
            'application_number' => $applicationNumber,
            'status' => 'draft'
        ], 'Permohonan SBU berhasil dibuat. Silakan lengkapi dokumen yang diperlukan dan submit permohonan.');
        
    } catch (Exception $e) {
        $db->rollback();
        throw $e; 
    }
    
} catch (Exception $e) {
    logApiRequest('POST', '/api/applications/create', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal membuat permohonan SBU: ' . $e->getMessage());
}