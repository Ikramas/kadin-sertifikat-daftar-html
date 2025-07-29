<?php
// File: backend/api/certificates/generate_pdf.php

// --- PERBAIKAN KRITIS: Definisikan ROOT_PATH secara eksplisit di sini ---
define('ROOT_PATH', dirname(__DIR__, 2) . '/');
// --- AKHIR PERBAIKAN KRITIS ---

require_once ROOT_PATH . 'error_handler.php';
require_once ROOT_PATH . 'config/cors.php';
require_once ROOT_PATH . 'config/database.php';
require_once ROOT_PATH . 'config/app.php'; 
require_once ROOT_PATH . 'classes/ApiResponse.php';
require_once ROOT_PATH . 'classes/JWT.php';
require_once ROOT_PATH . 'classes/SecurityManager.php';
require_once ROOT_PATH . 'classes/ErrorLogger.php'; 
require_once ROOT_PATH . 'classes/Utils.php';
require_once ROOT_PATH . 'classes/QRCodeGenerator.php';
require_once ROOT_PATH . 'vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    $currentUser = JWT::requireAuth(); // Memastikan user terautentikasi (bisa admin atau user biasa)

    $certificateId = $_GET['certificate_id'] ?? null;
    $certificateNumberParam = $_GET['certificate_number'] ?? null; // Tambahkan ini untuk fleksibilitas

    if (empty($certificateId) && empty($certificateNumberParam)) {
        ApiResponse::error('ID Sertifikat atau Nomor Sertifikat wajib disediakan.', 400);
    }

    $database = new Database();
    $db = $database->getConnection();

    // Ambil semua data yang diperlukan untuk sertifikat
    // Menggunakan ID atau Nomor Sertifikat untuk mencari
    $query = "
        SELECT
            cert.id, cert.certificate_number, cert.national_reg_number,
            cert.classification, cert.business_field, cert.qualification,
            cert.issued_date, cert.expiry_date, cert.status, cert.issuer_name,
            cert.certificate_file_path, cert.created_at, -- certificate_file_path seharusnya NULL sekarang
            app.application_number,
            u.name as user_name, u.email as user_email,
            comp.company_name, comp.address, comp.city, comp.postal_code,
            comp.province, comp.regency_city, comp.district, comp.village,
            comp.leader_name, comp.leader_position
        FROM certificates cert
        LEFT JOIN applications app ON cert.application_id = app.id
        LEFT JOIN users u ON cert.user_id = u.id
        LEFT JOIN companies comp ON u.id = comp.user_id
        WHERE (cert.id = ? OR cert.certificate_number = ?) AND (cert.user_id = ? OR ? IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND id = ?)); -- Filter by ID/Number AND current user ID atau admin role
    ";
    
    $stmt = $db->prepare($query);
    // Bind parameter secara hati-hati
    $stmt->execute([
        $certificateId, 
        $certificateNumberParam, 
        $currentUser['user_id'], 
        $currentUser['user_id'], 
        $currentUser['user_id']
    ]);
    
    $certificateData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$certificateData) {
        ApiResponse::notFound('Sertifikat tidak ditemukan atau Anda tidak memiliki akses.');
    }

    // Pastikan status sertifikat adalah 'active' sebelum dicetak
    // Atau jika admin, izinkan untuk dicetak walau belum active
    if ($certificateData['status'] !== 'active' && ($currentUser['role'] !== 'admin' && $currentUser['role'] !== 'super_admin')) {
        ApiResponse::error('Sertifikat ini belum aktif dan tidak dapat dicetak.', 400);
    }

    // --- Format Data untuk Template PDF ---
    $sbuNumber = htmlspecialchars($certificateData['certificate_number']);
    $nationalRegNumber = htmlspecialchars($certificateData['national_reg_number'] ?: '-');
    $companyName = htmlspecialchars($certificateData['company_name']);
    $leaderName = htmlspecialchars($certificateData['leader_name']);
    $leaderPosition = htmlspecialchars($certificateData['leader_position']);
    $classification = htmlspecialchars($certificateData['classification']);
    $businessField = htmlspecialchars($certificateData['business_field']);
    $qualification = htmlspecialchars($certificateData['qualification']);

    // Gabungkan alamat perusahaan
    $addressParts = array_filter([
        $certificateData['address'],
        $certificateData['village'],
        $certificateData['district'],
        $certificateData['regency_city'],
        $certificateData['province'],
        $certificateData['postal_code']
    ]);
    $formattedAddress = implode(', ', array_map('htmlspecialchars', $addressParts));

    $issuedDate = htmlspecialchars(date('d F Y', strtotime($certificateData['issued_date'])));
    $expiryDate = htmlspecialchars(date('d F Y', strtotime($certificateData['expiry_date'])));
    $issuerName = htmlspecialchars($certificateData['issuer_name']);
    
    // Ganti dengan data nyata dari konfigurasi atau database jika ada
    $issuedCity = 'Jakarta'; 
    $ketuaUmumKadin = 'Arsjad Rasjid'; 

    // --- Gambar Logo Lokal ---
    $kadinLogoPath = ASSETS_IMAGES_DIR . 'kadin-logo.png'; 
    $garudaLogoPath = ASSETS_IMAGES_DIR . 'garuda-pancasila.png'; 
    $bnspLogoPath = ASSETS_IMAGES_DIR . 'bnsp-logo.png'; 
    $texturePath = ASSETS_IMAGES_DIR . 'texture-light.png'; 

    // Menggunakan APP_BASE_URL untuk gambar agar Dompdf dapat mengaksesnya
    $kadinLogoSrc = file_exists($kadinLogoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($kadinLogoPath)) : APP_BASE_URL . '/assets/kadin-logo.png'; 
    $garudaLogoSrc = file_exists($garudaLogoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($garudaLogoPath)) : 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Lambang_Garuda_Pancasila.svg/1200px-Lambang_Garuda_Pancasila.svg.png';
    $bnspLogoSrc = file_exists($bnspLogoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($bnspLogoPath)) : 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/BNSP_Logo.svg/1200px-BNSP_Logo.svg.png';
    $textureSrc = file_exists($texturePath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($texturePath)) : APP_BASE_URL . '/assets/texture-light.png';


    // --- Generate Dynamic QR Code ---
    $qrCodeData = APP_BASE_URL . "/verify?sbu_id=" . $sbuNumber . "&user_id=" . $certificateData['user_id']; 
    $qrCodeSrc = '';
    try {
        $qrCodeSrc = QRCodeGenerator::generateQRCodeAsDataURI($qrCodeData, 150, 'png');
    } catch (Exception $qrE) {
        ErrorLogger::logSystemError('qr_code_generation_failed', 'Failed to generate QR code for SBU: ' . $sbuNumber . '. Error: ' . $qrE->getMessage(), ['user_id' => $currentUser['user_id']]);
    }

    // --- Dompdf Configuration ---
    $options = new Options();
    $options->set('isHtml5ParserEnabled', true);
    $options->set('isRemoteEnabled', true); 
    $options->set('defaultFont', 'Helvetica'); 
    $options->set('chroot', realpath('../../')); 

    $dompdf = new Dompdf($options);

    // --- HTML Content for PDF (Horizontal/Landscape, Modern Formal Design) ---
    $html = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Sertifikat ' . $sbuNumber . '</title>
        <style>
            /* Reset & Base */
            @page {
                margin: 0;
                size: A4 landscape;
            }
            body {
                font-family: "Helvetica Neue", "Helvetica", Arial, sans-serif; 
                margin: 0;
                padding: 0;
                font-size: 8pt;
                line-height: 1.1;
                color: #333;
                background-color: #ffffff;
            }

            .certificate-page {
                width: 297mm; 
                height: 210mm; 
                box-sizing: border-box;
                padding: 10mm;
                background-color: #ffffff;
            }

            .certificate-frame {
                width: 100%;
                height: 100%;
                border: 2mm solid #2b006a;
                padding: 5mm;
                box-sizing: border-box;
                background: url("' . htmlspecialchars($textureSrc) . '") repeat; 
                background-size: 60px;
                position: relative;
            }

            .content-area {
                width: calc(100% - 2mm); 
                height: calc(100% - 2mm);
                border: 0.5mm solid #a8a8a8; 
                padding: 8mm;
                box-sizing: border-box;
                background-color: #ffffff;
                position: absolute;
                top: 1mm;
                left: 1mm;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: stretch;
            }

            .header-section {
                width: 100%;
                text-align: center;
                margin-bottom: 4mm;
            }
            .header-logos {
                margin-bottom: 2mm;
            }
            .header-logos img {
                height: 9mm;
                max-width: 28mm;
                margin: 0 3mm;
                vertical-align: middle;
            }
            .title {
                font-size: 15pt; 
                font-weight: bold;
                color: #2c3e50; 
                margin-bottom: 1mm;
                line-height: 1;
                text-transform: uppercase;
            }
            .subtitle {
                font-size: 8.5pt;
                color: #555;
                margin-bottom: 5mm;
            }

            .sbu-number-box {
                text-align: center;
                margin-bottom: 5mm;
                padding: 2mm 4mm;
                border: 1px solid #ddd;
                background-color: #f0f0f0;
                display: inline-block;
                max-width: 60%;
                margin-left: auto;
                margin-right: auto;
                box-sizing: border-box;
            }
            .sbu-number {
                font-size: 10pt;
                font-weight: bold;
                color: #e74c3c; 
                text-transform: uppercase;
            }

            .main-content {
                flex-grow: 1; 
                padding: 0 4mm;
            }
            .intro-text {
                text-align: center;
                margin-bottom: 3mm;
                font-size: 8.5pt;
            }
            .recipient-info {
                text-align: center;
                margin-bottom: 4mm;
            }
            .recipient-info h2 {
                font-size: 11pt;
                font-weight: bold;
                color: #34495e;
                margin: 0 0 1mm 0;
                text-transform: uppercase;
            }
            .recipient-info p {
                font-size: 8pt;
                margin: 0;
            }

            .details-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 6mm;
                margin-top: 3mm;
            }
            .details-table td {
                padding: 1mm 0; 
                vertical-align: top;
                font-size: 8.5pt;
            }
            .details-table td:first-child {
                width: 35%; 
                font-weight: bold;
                color: #555;
                padding-right: 3mm;
            }
            .details-table span.value {
                font-weight: bold;
                color: #2c3e50;
            }

            .validity-text {
                text-align: center;
                margin-bottom: 6mm;
                font-size: 8.5pt;
            }
            .validity-text span.date {
                font-weight: bold;
                color: #2c3e50;
            }

            .signature-area {
                width: 100%;
                margin-top: 5mm;
                margin-bottom: 5mm;
            }
            .signature-area table {
                width: 100%;
                border-collapse: collapse;
            }
            .signature-area td {
                width: 50%;
                text-align: center;
                vertical-align: top;
                padding: 1mm 0; 
            }
            .signature-place-date {
                font-size: 8.5pt;
                margin-bottom: 0.5mm;
            }
            .signature-role {
                font-size: 8.5pt;
                font-weight: bold;
                color: #333;
                margin-bottom: 8mm;
                line-height: 1;
            }
            .signature-name {
                font-size: 9pt;
                font-weight: bold;
                color: #2c3e50;
                margin-top: 1mm;
            }
            .signature-line {
                border-bottom: 0.5mm solid #333;
                width: 60%;
                margin: 0 auto;
                display: block;
            }

            .footer-section {
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                padding-top: 4mm;
                border-top: 0.2mm solid #eee;
            }
            .qr-code-section {
                text-align: left;
                padding-left: 1mm;
            }
            .qr-code-section img {
                width: 18mm;
                height: 18mm;
                border: 0.5mm solid #ddd;
                padding: 0.5mm;
            }
            .qr-code-label {
                font-size: 6pt;
                color: #777;
                margin-top: 0.5mm;
            }
            .legal-text {
                flex-grow: 1;
                text-align: right;
                font-size: 6pt;
                color: #888;
                padding-right: 1mm;
                line-height: 1.1;
            }
        </style>
    </head>
    <body>
        <div class="certificate-page">
            <div class="certificate-frame">
                <div class="content-area">
                    <div class="header-section">
                        <div class="header-logos">
                            <img src="' . htmlspecialchars($garudaLogoSrc) . '" alt="Garuda Pancasila Logo">
                            <img src="' . htmlspecialchars($kadinLogoSrc) . '" alt="KADIN Indonesia Logo">
                            <img src="' . htmlspecialchars($bnspLogoSrc) . '" alt="BNSP Logo">
                        </div>
                        <div class="title">SERTIFIKAT BADAN USAHA</div>
                        <div class="subtitle">Diterbitkan Oleh: KADIN INDONESIA</div>
                    </div>

                    <div class="sbu-number-box">
                        <div class="sbu-number">NOMOR SERTIFIKAT: ' . htmlspecialchars($sbuNumber) . '</div>
                    </div>

                    <div class="main-content">
                        <p class="intro-text">Dengan ini menyatakan bahwa:</p>
                        <div class="recipient-info">
                            <h2>' . strtoupper(htmlspecialchars($certificateData['company_name'])) . '</h2>
                            <p>' . $formattedAddress . '</p>
                        </div>
                        <p class="intro-text">Telah memenuhi persyaratan dan dinyatakan kompeten sebagai Badan Usaha dengan:</p>

                        <div class="details-table">
                            <table>
                                <tr>
                                    <td>Klasifikasi</td>
                                    <td>: <span class="value">' . htmlspecialchars($certificateData['classification']) . '</span></td>
                                </tr>
                                <tr>
                                    <td>Bidang Usaha</td>
                                    <td>: <span class="value">' . htmlspecialchars($certificateData['business_field']) . '</span></td>
                                </tr>
                                <tr>
                                    <td>Kualifikasi</td>
                                    <td>: <span class="value">' . htmlspecialchars($certificateData['qualification']) . '</span></td>
                                </tr>
                                <tr>
                                    <td>Nomor Registrasi Nasional</td>
                                    <td>: <span class="value">' . htmlspecialchars($nationalRegNumber) . '</span></td>
                                </tr>
                            </table>
                        </div>
                        
                        <p class="validity-text">Sertifikat ini berlaku sampai dengan: <span class="date">' . htmlspecialchars($expiryDate) . '</span></p>
                    </div>

                    <div class="signature-area">
                        <table>
                            <tr>
                                <td>
                                    <p class="signature-place-date">' . htmlspecialchars($issuedCity) . ', ' . htmlspecialchars($issuedDate) . '</p>
                                    <p class="signature-role"><strong>' . strtoupper(htmlspecialchars($certificateData['leader_position'])) . '</strong></p>
                                    <p class="signature-name">' . htmlspecialchars($certificateData['leader_name']) . '</p>
                                    <span class="signature-line"></span>
                                </td>
                                <td>
                                    <p class="signature-place-date">' . htmlspecialchars($issuedCity) . ', ' . htmlspecialchars($issuedDate) . '</p>
                                    <p class="signature-role"><strong>KETUA UMUM KADIN INDONESIA</strong></p>
                                    <p class="signature-name">' . htmlspecialchars($ketuaUmumKadin) . '</p> 
                                    <span class="signature-line"></span>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div class="footer-section">
                        <div class="qr-code-section">
                            ' . (!empty($qrCodeSrc) ? '<img src="' . htmlspecialchars($qrCodeSrc) . '" alt="QR Code Verifikasi">' : '') . '
                            <div class="qr-code-label">Scan untuk Verifikasi</div>
                        </div>
                        <div class="legal-text">
                            Sertifikat ini diterbitkan secara elektronik dan dapat diverifikasi secara online di portal KADIN Indonesia.
                            <br>Untuk informasi lebih lanjut, kunjungi: <a href="'. APP_BASE_URL .'" style="color:#888; text-decoration:none;">' . APP_BASE_URL . '</a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </body>
    </html>';

    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'landscape'); 
    $dompdf->render();

    // --- PERBAIKAN KRITIS: Mengatur Content-Disposition menjadi 'attachment' ---
    $fileName = 'Sertifikat_SBU_' . str_replace(['/', '\\'], '_', $sbuNumber) . '.pdf';

    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $fileName . '"'); // 'attachment' akan memicu unduhan
    header('Cache-Control: public, must-revalidate, max-age=0');
    header('Pragma: public');
    header('Expires: Sat, 26 Jul 1997 05:00:00 GMT'); 
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT'); 
    
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    echo $dompdf->output(); 
    exit; 
    // --- AKHIR PERBAIKAN KRITIS ---

} catch (Exception $e) {
    ErrorLogger::logSystemError('certificate_pdf_generation_failed', $e->getMessage(), ['certificate_id' => $certificateId ?? 'N/A', 'user_id' => $currentUser['user_id'] ?? 'N/A']);
    ApiResponse::serverError('Gagal membuat sertifikat PDF: ' . $e->getMessage());
}