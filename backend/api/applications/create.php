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
    $mainClassificationInput = $input['mainClassificationInput'] ?? ''; // New field name from frontend
    $bidangName = $input['bidangName'] ?? ''; // Existing field name from frontend, for detailed business field
    $subBidangCode = $input['subBidangCode'] ?? ''; // Existing field name from frontend
    $companyQualification = $input['companyQualification'] ?? ''; 
    $notes = $input['notes'] ?? null; 
    
    // Bidang NPWP/NIB yang diambil otomatis dari profil perusahaan
    // Pastikan ini adalah nilai yang diambil dari `company` object di frontend, bukan dari input user.
    // Jika `npwp`, `leader_npwp`, dan `nib` tidak dikirim dari frontend,
    // maka Anda perlu mengambilnya dari database di sisi backend.
    $npwpPerusahaan = $input['npwp'] ?? null;
    $npwpPimpinan = $input['leader_npwp'] ?? null;
    $nib = $input['nib'] ?? null;

    // Bidang legalitas dan kompetensi baru dari formulir
    $aktaPendirianNotaris = $input['aktaPendirianNotaris'] ?? null;
    $aktaPendirianNomor = $input['aktaPendirianNomor'] ?? null;
    $aktaPendirianTanggal = $input['aktaPendirianTanggal'] ?? null; 
    $aktaPerubahanNotaris = $input['aktaPerubahanNotaris'] ?? null;
    $aktaPerubahanNomor = $input['aktaPerubahanNomor'] ?? null;
    $aktaPerubahanTanggal = $input['aktaPerubahanTanggal'] ?? null; 
    $skKemenkumhamNomorTanggal = $input['skKemenkumhamNomorTanggal'] ?? null;
    $nibDate = $input['nibDate'] ?? null; 

    // ID dokumen yang di-upload bersamaan dengan form SBU
    $uploadedSbuDocumentIds = $input['uploaded_documents_sbu'] ?? []; 

    // Melakukan validasi input
    $validator = new Validator();
    $validator
        ->required('applicationType', $applicationType, 'Jenis permohonan wajib dipilih')
        ->custom('applicationType', $applicationType, function($value) {
            return in_array($value, ['new', 'renewal', 'upgrade']);
        }, 'Jenis permohonan tidak valid')
        ->required('mainClassificationInput', $mainClassificationInput, 'Klasifikasi utama wajib diisi') // Validasi field baru
        ->required('bidangName', $bidangName, 'Nama bidang usaha wajib diisi') // Validasi field yang sudah ada
        ->required('subBidangCode', $subBidangCode, 'Kode Subbidang wajib diisi') // Validasi field yang sudah ada
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
    
    // Akta Perubahan adalah opsional, jadi validasi hanya jika ada nilai
    if (!empty($aktaPerubahanTanggal) && !DateTime::createFromFormat('Y-m-d', $aktaPerubahanTanggal)) {
        ApiResponse::error('Format Tanggal Perubahan tidak valid (YYYY-MM-DD)', 422, ['aktaPerubahanTanggal' => 'Format tanggal tidak valid']);
    }

    $validator->required('skKemenkumhamNomorTanggal', $skKemenkumhamNomorTanggal, 'Nomor/Tanggal SK Kemenkumham wajib diisi');
    $validator->required('nibDate', $nibDate, 'Tanggal NIB wajib diisi');
        if (!empty($nibDate) && !DateTime::createFromFormat('Y-m-d', $nibDate)) {
             ApiResponse::error('Format Tanggal NIB tidak valid (YYYY-MM-DD)', 422, ['nibDate' => 'Format tanggal tidak valid']);
        }
    
    // Validasi NPWP/NIB dari profil perusahaan (otomatis)
    // Sebaiknya, ambil ini dari DB berdasarkan user_id daripada mengandalkan frontend untuk mengirimnya
    // Untuk saat ini, kita validasi jika `input` mengandungnya.
    $validator
        ->required('npwp', $npwpPerusahaan, 'NPWP Perusahaan tidak ditemukan di profil')
        ->required('leader_npwp', $npwpPimpinan, 'NPWP Pimpinan tidak ditemukan di profil')
        ->required('nib', $nib, 'NIB tidak ditemukan di profil');

    $validator->validate();
    
    // Koneksi ke database
    $database = new Database();
    $db = $database->getConnection();
    
    // Mendapatkan data perusahaan user
    $stmt = $db->prepare("SELECT id, status, npwp, nib, leader_npwp FROM companies WHERE user_id = ?");
    $stmt->execute([$currentUser['user_id']]);
    $company = $stmt->fetch();
    
    if (!$company || $company['status'] !== 'verified') {
        ApiResponse::error('Data perusahaan belum terverifikasi atau tidak ditemukan. Silakan hubungi administrator.');
    }

    // Overwrite NPWP/NIB/Leader NPWP with values from DB for consistency, if frontend didn't provide them reliably
    $npwpPerusahaan = $company['npwp'];
    $npwpPimpinan = $company['leader_npwp'];
    $nib = $company['nib'];
    
    // Menghasilkan nomor aplikasi yang unik
    $currentYear = date('Y');
    $stmt = $db->prepare("SELECT COUNT(*) FROM applications WHERE YEAR(created_at) = ?");
    $stmt->execute([$currentYear]);
    $count = $stmt->fetchColumn() + 1;
    $applicationNumber = 'SBU-' . $currentYear . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    
    // Memulai transaksi database
    $db->beginTransaction();
    
    try {
        // Memasukkan aplikasi ke database
        // PASTIKAN SEMUA KOLOM DI BAWAH INI ADA DI TABEL `applications` DAN URUTANNYA BENAR
        $stmt = $db->prepare("
            INSERT INTO applications (
                user_id, company_id, application_number, application_type,
                current_sbu_number, requested_classification, business_field,
                company_qualification, notes,
                
                -- Kolom legalitas & kompetensi baru (sesuai skema DB Anda)
                akta_pendirian_notaris, akta_pendirian_nomor, akta_pendirian_tanggal,
                akta_perubahan_notaris, akta_perubahan_nomor, akta_perubahan_tanggal,
                sk_kemenkumham_nomor_tanggal, nib_date, sub_bidang_code, bidang_name,
                npwp_perusahaan, npwp_pimpinan, nib_perusahaan,

                status, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?,
                'draft', NOW()
            )
        ");
        $stmt->execute([
            $currentUser['user_id'],
            $company['id'],
            $applicationNumber,
            $applicationType,
            $currentSbuNumber, // Bisa NULL jika applicationType adalah 'new'
            $mainClassificationInput, // Mapped from frontend new field `mainClassificationInput`
            $bidangName, // Mapped from frontend `bidangName` to `business_field`
            $companyQualification,
            $notes, // Bisa NULL

            // Nilai untuk kolom-kolom legalitas dan kompetensi (pastikan urutan sesuai dengan kolom di atas)
            $aktaPendirianNotaris,
            $aktaPendirianNomor,
            $aktaPendirianTanggal,
            $aktaPerubahanNotaris, // Bisa NULL
            $aktaPerubahanNomor, // Bisa NULL
            $aktaPerubahanTanggal, // Bisa NULL
            $skKemenkumhamNomorTanggal,
            $nibDate,
            $subBidangCode,
            $bidangName, // Mapped from frontend `bidangName` to `bidang_name`

            // Nilai NPWP/NIB dari profil perusahaan (otomatis dari DB `company` object)
            $npwpPerusahaan,
            $npwpPimpinan,
            $nib
        ]);
        
        $applicationId = $db->lastInsertId();
        
        // Mengaitkan dokumen yang diunggah dengan permohonan SBU
        if (!empty($uploadedSbuDocumentIds)) { 
            $placeholders = str_repeat('?,', count($uploadedSbuDocumentIds) - 1) . '?';
            $stmt = $db->prepare("SELECT id FROM documents WHERE id IN ($placeholders) AND user_id = ?");
            $stmt->execute(array_merge($uploadedSbuDocumentIds, [$currentUser['user_id']]));
            $verifiedDocumentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($verifiedDocumentIds as $documentId) {
                // Perbarui `related_application_id` untuk setiap dokumen yang diunggah
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
