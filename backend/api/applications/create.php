<?php
// File: backend/api/applications/create.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/app.php'; // Muat konfigurasi APP_BASE_URL
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/JWT.php';
require_once '../../classes/ErrorLogger.php'; 
require_once '../../classes/Utils.php'; // Muat kelas Utils

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
        ApiResponse::forbidden('Anda belum dapat mengajukan SBU. Silakan lengkapi dokumen registrasi perusahaan terlebih dahulu.');
    }
    
    // Mengambil input JSON
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        ApiResponse::error('Data JSON tidak valid', 400);
    }
    
    // Melakukan sanitasi input
    $input = SecurityManager::sanitizeInput($input);
    
    // Mengekstrak data dari request (sesuai nama field dari form React Hook Form)
    $applicationType = $input['applicationType'] ?? ''; 
    $currentSbuNumber = $input['currentSbuNumber'] ?? null; 
    $mainClassificationInput = $input['mainClassificationInput'] ?? ''; 
    $bidangName = $input['bidangName'] ?? ''; 
    $subBidangCode = $input['subBidangCode'] ?? ''; 
    $companyQualification = $input['companyQualification'] ?? ''; 
    $notes = $input['notes'] ?? null; 
    
    // Data Akta/Legalitas
    $aktaPendirianNotaris = $input['aktaPendirianNotaris'] ?? null;
    $aktaPendirianNomor = $input['aktaPendirianNomor'] ?? null;
    $aktaPendirianTanggal = $input['aktaPendirianTanggal'] ?? null; 
    $aktaPerubahanNotaris = $input['aktaPerubahanNotaris'] ?? null;
    $aktaPerubahanNomor = $input['aktaPerubahanNomor'] ?? null;
    $aktaPerubahanTanggal = $input['aktaPerubahanTanggal'] ?? null; 
    $skKemenkumhamNomorTanggal = $input['skKemenkumhamNomorTanggal'] ?? null;
    $nibDate = $input['nibDate'] ?? null; 

    // Dokumen SBU yang diunggah sementara (IDs)
    $uploadedSbuDocumentIds = $input['uploaded_documents_sbu'] ?? []; 

    // Koneksi ke database
    $database = new Database();
    $db = $database->getConnection();

    // Mendapatkan data perusahaan user dari database (untuk NPWP, NIB, Leader NPWP)
    $stmtCompany = $db->prepare("SELECT id, status, npwp, nib, leader_npwp FROM companies WHERE user_id = ?");
    $stmtCompany->execute([$currentUser['user_id']]);
    $company = $stmtCompany->fetch(PDO::FETCH_ASSOC);
    
    if (!$company || $company['status'] !== 'verified') {
        ApiResponse::error('Data perusahaan belum terverifikasi atau tidak ditemukan. Silakan lengkapi dokumen registrasi dan tunggu verifikasi administrator.', 403);
    }

    $npwpPerusahaan = $company['npwp'];
    $npwpPimpinan = $company['leader_npwp'];
    $nibPerusahaan = $company['nib']; // Ganti nama variabel agar tidak duplikasi dengan input $nib

    // Melakukan validasi input
    $validator = new Validator();
    $validator
        ->required('applicationType', $applicationType, 'Jenis permohonan wajib dipilih')
        ->custom('applicationType', $applicationType, function($value) {
            return in_array($value, ['new', 'renewal', 'upgrade']);
        }, 'Jenis permohonan tidak valid')
        ->required('mainClassificationInput', $mainClassificationInput, 'Klasifikasi utama wajib diisi') 
        ->required('bidangName', $bidangName, 'Nama bidang usaha wajib diisi') 
        ->required('subBidangCode', $subBidangCode, 'Kode Subbidang wajib diisi') 
        ->required('companyQualification', $companyQualification, 'Kualifikasi perusahaan wajib dipilih')
        ->custom('companyQualification', $companyQualification, function($value) {
            return in_array($value, ['Kecil', 'Menengah', 'Besar']);
        }, 'Kualifikasi perusahaan tidak valid');
    
    if (in_array($applicationType, ['renewal', 'upgrade'])) {
        $validator->required('currentSbuNumber', $currentSbuNumber, 'Nomor SBU saat ini wajib diisi untuk perpanjangan/upgrade');
    }

    // Validasi Bidang Legalitas & Kompetensi
    $validator
        ->required('aktaPendirianNotaris', $aktaPendirianNotaris, 'Nama Notaris Akta Pendirian wajib diisi')
        ->required('aktaPendirianNomor', $aktaPendirianNomor, 'Nomor Akta Pendirian wajib diisi')
        ->required('aktaPendirianTanggal', $aktaPendirianTanggal, 'Tanggal Akta Pendirian wajib diisi')
        ->date('aktaPendirianTanggal', $aktaPendirianTanggal, 'Y-m-d', 'Format Tanggal Akta Pendirian tidak valid (YYYY-MM-DD)'); 

    // Jika akta perubahan diisi, validasi juga
    if (!empty($aktaPerubahanNotaris) || !empty($aktaPerubahanNomor) || !empty($aktaPerubahanTanggal)) {
        $validator
            ->required('aktaPerubahanNotaris', $aktaPerubahanNotaris, 'Nama Notaris Akta Perubahan wajib diisi jika ada Akta Perubahan')
            ->required('aktaPerubahanNomor', $aktaPerubahanNomor, 'Nomor Akta Perubahan wajib diisi jika ada Akta Perubahan')
            ->required('aktaPerubahanTanggal', $aktaPerubahanTanggal, 'Tanggal Akta Perubahan wajib diisi jika ada Akta Perubahan');
    }
    // Validasi format tanggal untuk akta perubahan jika ada nilainya
    if (!empty($aktaPerubahanTanggal)) {
         $validator->date('aktaPerubahanTanggal', $aktaPerubahanTanggal, 'Y-m-d', 'Format Tanggal Akta Perubahan tidak valid (YYYY-MM-DD)');
    }

    $validator->required('skKemenkumhamNomorTanggal', $skKemenkumhamNomorTanggal, 'Nomor/Tanggal SK Kemenkumham wajib diisi');
    $validator->required('nibDate', $nibDate, 'Tanggal NIB wajib diisi')
        ->date('nibDate', $nibDate, 'Y-m-d', 'Format Tanggal NIB tidak valid (YYYY-MM-DD)'); 

    $validator->validate(); 

    // Menghasilkan nomor aplikasi yang unik (SBU-YYYY-NNNN)
    // Gunakan logika serial number jika diinginkan, atau hapus dan gunakan code_reg saja jika application_number tidak perlu serial
    $currentYear = date('Y');
    $stmt = $db->prepare("SELECT COUNT(*) FROM applications WHERE YEAR(created_at) = ?");
    $stmt->execute([$currentYear]);
    $count = $stmt->fetchColumn() + 1;
    $applicationNumber = 'SBU-' . $currentYear . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    
    // Menghasilkan code_reg unik acak numerik (SP-000000000)
    $codeReg = Utils::generateUniqueCode('SP-', 9, $db, 'applications', 'code_reg'); // Gunakan Utils

    // Memulai transaksi database
    $db->beginTransaction();
    
    try {
        $stmt = $db->prepare("
            INSERT INTO applications (
                user_id, company_id, application_number, code_reg, application_type,
                current_sbu_number, requested_classification, business_field,
                company_qualification, notes,
                
                akta_pendirian_notaris, akta_pendirian_nomor, akta_pendirian_tanggal,
                akta_perubahan_notaris, akta_perubahan_nomor, akta_perubahan_tanggal,
                sk_kemenkumham_nomor_tanggal, nib_date, sub_bidang_code, bidang_name,
                npwp_perusahaan, npwp_pimpinan, nib_perusahaan,

                status, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?,
                'draft', NOW()
            )
        ");
        $stmt->execute([
            $currentUser['user_id'],
            $company['id'],
            $applicationNumber,
            $codeReg, 
            $applicationType,
            $currentSbuNumber,
            $mainClassificationInput,
            $bidangName,
            $companyQualification,
            $notes,

            $aktaPendirianNotaris,
            $aktaPendirianNomor,
            $aktaPendirianTanggal,
            $aktaPerubahanNotaris,
            $aktaPerubahanNomor,
            $aktaPerubahanTanggal,
            $skKemenkumhamNomorTanggal,
            $nibDate,
            $subBidangCode,
            $bidangName,

            $npwpPerusahaan, // Diambil dari DB company
            $npwpPimpinan,   // Diambil dari DB company
            $nibPerusahaan   // Diambil dari DB company
        ]);
        
        $applicationId = $db->lastInsertId();
        
        // Mengaitkan dokumen yang diunggah dengan permohonan SBU
        if (!empty($uploadedSbuDocumentIds)) { 
            $placeholders = str_repeat('?,', count($uploadedSbuDocumentIds) - 1) . '?';
            // Validasi: Pastikan dokumen-dokumen ini memang milik user yang sedang login
            $stmt = $db->prepare("SELECT id FROM documents WHERE id IN ($placeholders) AND user_id = ? AND category = 'sbu_application_temp'"); 
            $stmt->execute(array_merge($uploadedSbuDocumentIds, [$currentUser['user_id']]));
            $verifiedDocumentIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (count($verifiedDocumentIds) !== count($uploadedSbuDocumentIds)) {
                // --- PERBAIKAN: Ubah panggilan ke fungsi global logSecurityEvent ---
                logSecurityEvent('application_create_doc_mismatch', 'Some SBU application documents provided were not found or not in temp category for user.', [
                    'user_id' => $currentUser['user_id'],
                    'provided_ids' => $uploadedSbuDocumentIds,
                    'verified_ids' => $verifiedDocumentIds
                ]);
                // --- AKHIR PERBAIKAN ---
                throw new Exception("Beberapa dokumen SBU yang diunggah tidak valid atau bukan milik Anda.");
            }

            foreach ($verifiedDocumentIds as $documentId) {
                $stmt = $db->prepare("
                    UPDATE documents SET 
                        category = 'sbu_application', 
                        related_application_id = ?,
                        status = 'uploaded' 
                    WHERE id = ? AND user_id = ?
                ");
                $stmt->execute([$applicationId, $documentId, $currentUser['user_id']]);
            }
        }
        
        // Membuat notifikasi untuk admin
        $stmt = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, related_type, related_id, created_at)
            SELECT id, 'Permohonan SBU Baru', 
                   CONCAT('Pengguna ', ?, ' (ID: ', ?, ') telah membuat permohonan SBU dengan nomor ', ?, ' dalam status draft.'),
                   'info', 'application', ?, NOW()
            FROM users WHERE role IN ('admin', 'super_admin')
        ");
        $stmt->execute([$currentUser['name'], $currentUser['user_id'], $applicationNumber, $applicationId]); 
        
        // Commit transaksi
        $db->commit();
        
        logApiRequest('POST', '/api/applications/create', [
            'user_id' => $currentUser['user_id'],
            'application_type' => $applicationType,
            'application_number' => $applicationNumber,
            'code_reg' => $codeReg 
        ], 'success'); 
        
        ApiResponse::success([
            'application_id' => $applicationId,
            'application_number' => $applicationNumber,
            'code_reg' => $codeReg, 
            'status' => 'draft'
        ], 'Permohonan SBU berhasil dibuat. Silakan lengkapi dokumen yang diperlukan dan submit permohonan.');
        
    } catch (Exception $e) {
        $db->rollback();
        ErrorLogger::logSystemError('application_creation_transaction_failed', $e->getMessage(), ['user_id' => $currentUser['user_id'], 'input' => $input]);
        logApiRequest('POST', '/api/applications/create', $input ?? null, $e->getMessage());
        ApiResponse::serverError('Gagal membuat permohonan SBU: ' . $e->getMessage());
    }
    
} catch (Exception $e) {
    ErrorLogger::logSystemError('application_creation_api_error', $e->getMessage(), ['input' => $input ?? null]);
    logApiRequest('POST', '/api/applications/create', $input ?? null, $e->getMessage());
    ApiResponse::serverError('Gagal membuat permohonan SBU: ' . $e->getMessage());
}