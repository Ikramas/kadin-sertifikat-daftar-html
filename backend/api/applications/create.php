<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/Validator.php';
require_once '../../classes/SecurityManager.php';
require_once '../../classes/CSRFProtection.php';
require_once '../../classes/JWT.php';

// Fungsi untuk menghasilkan code_reg unik acak dengan format SP-000000000 (9 digit angka)
if (!function_exists('generateRandomNumericCodeReg')) {
    function generateRandomNumericCodeReg($prefix = 'SP-', $numDigits = 9, $db) {
        $code = '';
        $isUnique = false;
        $attempts = 0;
        $maxAttempts = 100; // Batasi upaya untuk menghindari loop tak terbatas, meskipun sangat tidak mungkin terjadi collision
        
        while (!$isUnique && $attempts < $maxAttempts) {
            // Menghasilkan angka acak dalam rentang 9 digit
            // mt_rand() lebih cepat dari rand() dan cukup acak untuk kebutuhan ini
            $randomNum = str_pad(mt_rand(1, (10**$numDigits) - 1), $numDigits, '0', STR_PAD_LEFT);
            $code = $prefix . $randomNum;

            // Periksa keunikan di database
            $stmtCheck = $db->prepare("SELECT COUNT(*) FROM applications WHERE code_reg = ?");
            $stmtCheck->execute([$code]);
            if ($stmtCheck->fetchColumn() == 0) {
                $isUnique = true;
            }
            $attempts++;
        }

        if (!$isUnique) {
            // Jika setelah beberapa upaya tidak dapat menghasilkan yang unik (sangat langka)
            throw new Exception("Gagal membuat kode registrasi numerik unik setelah beberapa upaya. Silakan coba lagi.");
        }
        return $code;
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
    $mainClassificationInput = $input['mainClassificationInput'] ?? ''; 
    $bidangName = $input['bidangName'] ?? ''; 
    $subBidangCode = $input['subBidangCode'] ?? ''; 
    $companyQualification = $input['companyQualification'] ?? ''; 
    $notes = $input['notes'] ?? null; 
    
    $npwpPerusahaan = $input['npwp'] ?? null;
    $npwpPimpinan = $input['leader_npwp'] ?? null;
    $nib = $input['nib'] ?? null;

    $aktaPendirianNotaris = $input['aktaPendirianNotaris'] ?? null;
    $aktaPendirianNomor = $input['aktaPendirianNomor'] ?? null;
    $aktaPendirianTanggal = $input['aktaPendirianTanggal'] ?? null; 
    $aktaPerubahanNotaris = $input['aktaPerubahanNotaris'] ?? null;
    $aktaPerubahanNomor = $input['aktaPerubahanNomor'] ?? null;
    $aktaPerubahanTanggal = $input['aktaPerubahanTanggal'] ?? null; 
    $skKemenkumhamNomorTanggal = $input['skKemenkumhamNomorTanggal'] ?? null;
    $nibDate = $input['nibDate'] ?? null; 

    $uploadedSbuDocumentIds = $input['uploaded_documents_sbu'] ?? []; 

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

    $npwpPerusahaan = $company['npwp'];
    $npwpPimpinan = $company['leader_npwp'];
    $nib = $company['nib'];
    
    // Menghasilkan nomor aplikasi yang unik (SBU-YYYY-NNNN)
    $currentYear = date('Y');
    $stmt = $db->prepare("SELECT COUNT(*) FROM applications WHERE YEAR(created_at) = ?");
    $stmt->execute([$currentYear]);
    $count = $stmt->fetchColumn() + 1;
    $applicationNumber = 'SBU-' . $currentYear . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    
    // Menghasilkan code_reg unik acak numerik (SP-000000000)
    $codeReg = generateRandomNumericCodeReg('SP-', 9, $db);

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
            $codeReg, // <-- Nilai baru untuk code_reg
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
            'application_number' => $applicationNumber,
            'code_reg' => $codeReg 
        ], ['success' => true, 'application_id' => $applicationId, 'code_reg' => $codeReg]); 
        
        ApiResponse::success([
            'application_id' => $applicationId,
            'application_number' => $applicationNumber,
            'code_reg' => $codeReg, 
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