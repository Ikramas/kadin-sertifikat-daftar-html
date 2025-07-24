<?php
// File: backend/api/certificates/generate_pdf.php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../vendor/autoload.php'; // Penting: Muat autoloader Composer

use Dompdf\Dompdf;
use Dompdf\Options;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // Autentikasi pengguna
    $currentUser = JWT::requireAuth();

    $certificateId = $_GET['certificate_id'] ?? null;

    if (!$certificateId) {
        ApiResponse::error('ID Sertifikat tidak disediakan.', 400);
    }

    $database = new Database();
    $db = $database->getConnection();

    // Ambil semua data yang diperlukan untuk sertifikat
    $stmt = $db->prepare("
        SELECT
            cert.id, cert.certificate_number, cert.national_reg_number,
            cert.classification, cert.business_field, cert.qualification,
            cert.issued_date, cert.expiry_date, cert.status, cert.issuer_name,
            cert.certificate_file_path, cert.created_at,
            app.application_number,
            u.name as user_name, u.email as user_email,
            comp.company_name, comp.address, comp.city, comp.postal_code,
            comp.province, comp.regency_city, comp.district, comp.village,
            comp.leader_name, comp.leader_position
        FROM certificates cert
        LEFT JOIN applications app ON cert.application_id = app.id
        LEFT JOIN users u ON cert.user_id = u.id
        LEFT JOIN companies comp ON u.id = comp.user_id
        WHERE cert.id = ? AND cert.user_id = ?; -- Pastikan sertifikat milik user ini
    ");
    $stmt->execute([$certificateId, $currentUser['user_id']]);
    $certificateData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$certificateData) {
        ApiResponse::notFound('Sertifikat tidak ditemukan atau Anda tidak memiliki akses.');
    }

    // Pastikan status sertifikat adalah 'active' sebelum dicetak
    if ($certificateData['status'] !== 'active') {
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
    $issuedCity = 'Jakarta'; // Placeholder, jika ada kolom di DB bisa diambil dari sana

    // --- Generate Dynamic QR Code ---
    // Pastikan URL verifikasi ini akurat
    $qrCodeData = "https://your-portal.com/verify?sbu_id=" . $sbuNumber . "&user_id=" . $currentUser['user_id']; 
    $qrCodeUrl = 'https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=' . urlencode($qrCodeData);

    $qrCodeImage = @file_get_contents($qrCodeUrl); 
    $qrCodeSrc = '';
    if ($qrCodeImage !== FALSE) {
        $qrCodeSrc = 'data:image/png;base64,' . base64_encode($qrCodeImage);
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
                size: A4 landscape; /* A4 horizontal */
            }
            body {
                font-family: "Helvetica Neue", "Helvetica", Arial, sans-serif; 
                margin: 0;
                padding: 0;
                font-size: 8pt; /* Font dasar, sangat kecil */
                line-height: 1.1; /* Sangat rapat */
                color: #333;
                background-color: #ffffff;
            }

            /* Main Certificate Page Container (physical A4 size) */
            .certificate-page {
                width: 297mm; 
                height: 210mm; 
                box-sizing: border-box;
                padding: 10mm; /* Padding untuk jarak dari tepi fisik kertas */
                background-color: #ffffff;
            }

            /* Inner Frame - This will have the main visual border and background */
            .certificate-frame {
                width: 100%;
                height: 100%;
                border: 2mm solid #2b006a; /* Border tebal ungu */
                padding: 5mm; /* Padding di dalam frame */
                box-sizing: border-box;
                background: url("https://i.ibb.co/g42vW9s/texture-light.png") repeat; /* Background texture */
                background-size: 60px; /* Ukuran texture lebih kecil */
                position: relative;
            }

            /* Content Area - The actual white content box */
            .content-area {
                width: calc(100% - 2mm); /* Mengakomodasi inner thin border */
                height: calc(100% - 2mm);
                border: 0.5mm solid #a8a8a8; /* Border tipis di dalam frame */
                padding: 8mm; /* Padding untuk konten aktual */
                box-sizing: border-box;
                background-color: #ffffff; /* Latar belakang konten putih solid */
                position: absolute;
                top: 1mm;
                left: 1mm;
                display: flex;
                flex-direction: column;
                justify-content: space-between; /* Untuk mendorong footer ke bawah */
                align-items: stretch;
            }

            /* Header Section (Logos & Main Title) */
            .header-section {
                width: 100%;
                text-align: center;
                margin-bottom: 4mm;
            }
            .header-logos {
                margin-bottom: 2mm;
            }
            .header-logos img {
                height: 9mm; /* Tinggi logo lebih kecil */
                max-width: 28mm;
                margin: 0 3mm;
                vertical-align: middle;
            }
            .title {
                font-size: 15pt; /* Lebih kecil */
                font-weight: bold;
                color: #2c3e50; 
                margin-bottom: 1mm;
                line-height: 1;
                text-transform: uppercase;
            }
            .subtitle {
                font-size: 8.5pt; /* Lebih kecil */
                color: #555;
                margin-bottom: 5mm;
            }

            /* SBU Number Box */
            .sbu-number-box {
                text-align: center;
                margin-bottom: 5mm;
                padding: 2mm 4mm; /* Padding lebih kecil */
                border: 1px solid #ddd;
                background-color: #f0f0f0;
                display: inline-block;
                max-width: 60%;
                margin-left: auto;
                margin-right: auto;
                box-sizing: border-box;
            }
            .sbu-number {
                font-size: 10pt; /* Lebih kecil */
                font-weight: bold;
                color: #e74c3c; 
                text-transform: uppercase;
            }

            /* Main Content Area */
            .main-content {
                flex-grow: 1; 
                padding: 0 4mm; /* Padding horizontal */
            }
            .intro-text {
                text-align: center;
                margin-bottom: 3mm; /* Lebih rapat */
                font-size: 8.5pt;
            }
            .recipient-info {
                text-align: center;
                margin-bottom: 4mm; /* Lebih rapat */
            }
            .recipient-info h2 {
                font-size: 11pt; /* Lebih kecil */
                font-weight: bold;
                color: #34495e;
                margin: 0 0 1mm 0;
                text-transform: uppercase;
            }
            .recipient-info p {
                font-size: 8pt; /* Lebih kecil */
                margin: 0;
            }

            /* Details Table */
            .details-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 6mm; /* Lebih rapat */
                margin-top: 3mm;
            }
            .details-table td {
                padding: 1mm 0; /* Padding sangat kecil */
                vertical-align: top;
                font-size: 8.5pt; /* Lebih kecil */
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
                margin-bottom: 6mm; /* Lebih rapat */
                font-size: 8.5pt;
            }
            .validity-text span.date {
                font-weight: bold;
                color: #2c3e50;
            }

            /* Signature Area */
            .signature-area {
                width: 100%;
                margin-top: 5mm; /* Lebih rapat */
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
                margin-bottom: 8mm; /* Ruang untuk tanda tangan */
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

            /* Footer Section */
            .footer-section {
                width: 100%;
                display: flex; /* Menggunakan flexbox untuk tata letak QR dan teks */
                justify-content: space-between;
                align-items: flex-end; /* Memastikan QR dan teks rata bawah */
                padding-top: 4mm; /* Padding dari atas border footer */
                border-top: 0.2mm solid #eee; /* Garis pemisah tipis */
            }
            .qr-code-section {
                text-align: left;
                padding-left: 1mm;
            }
            .qr-code-section img {
                width: 18mm; /* Ukuran QR code lebih kecil */
                height: 18mm;
                border: 0.5mm solid #ddd;
                padding: 0.5mm;
            }
            .qr-code-label {
                font-size: 6pt; /* Font paling kecil */
                color: #777;
                margin-top: 0.5mm;
            }
            .legal-text {
                flex-grow: 1;
                text-align: right;
                font-size: 6pt; /* Font paling kecil */
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
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Lambang_Garuda_Pancasila.svg/1200px-Lambang_Garuda_Pancasila.svg.png" alt="Garuda Pancasila Logo">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Logo_Kadin_Indonesia.svg/1200px-Logo_Kadin_Indonesia.svg.png" alt="KADIN Indonesia Logo">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/BNSP_Logo.svg/1200px-BNSP_Logo.svg.png" alt="BNSP Logo">
                        </div>
                        <div class="title">SERTIFIKAT BADAN USAHA</div>
                        <div class="subtitle">Diterbitkan Oleh: KADIN INDONESIA</div>
                    </div>

                    <div class="sbu-number-box">
                        <div class="sbu-number">NOMOR SERTIFIKAT: ' . $sbuNumber . '</div>
                    </div>

                    <div class="main-content">
                        <p class="intro-text">Dengan ini menyatakan bahwa:</p>
                        <div class="recipient-info">
                            <h2>' . strtoupper($companyName) . '</h2>
                            <p>' . $formattedAddress . '</p>
                        </div>
                        <p class="intro-text">Telah memenuhi persyaratan dan dinyatakan kompeten sebagai Badan Usaha dengan:</p>

                        <div class="details-table">
                            <table>
                                <tr>
                                    <td>Klasifikasi</td>
                                    <td>: <span class="value">' . $classification . '</span></td>
                                </tr>
                                <tr>
                                    <td>Bidang Usaha</td>
                                    <td>: <span class="value">' . $businessField . '</span></td>
                                </tr>
                                <tr>
                                    <td>Kualifikasi</td>
                                    <td>: <span class="value">' . $qualification . '</span></td>
                                </tr>
                                <tr>
                                    <td>Nomor Registrasi Nasional</td>
                                    <td>: <span class="value">' . $nationalRegNumber . '</span></td>
                                </tr>
                            </table>
                        </div>
                        
                        <p class="validity-text">Sertifikat ini berlaku sampai dengan: <span class="date">' . $expiryDate . '</span></p>
                    </div>

                    <div class="signature-area">
                        <table>
                            <tr>
                                <td>
                                    <p class="signature-place-date">' . $issuedCity . ', ' . $issuedDate . '</p>
                                    <p class="signature-role"><strong>' . strtoupper($leaderPosition) . '</strong></p>
                                    <p class="signature-name">' . $leaderName . '</p>
                                    <span class="signature-line"></span>
                                </td>
                                <td>
                                    <p class="signature-place-date">' . $issuedCity . ', ' . $issuedDate . '</p>
                                    <p class="signature-role"><strong>KETUA UMUM KADIN INDONESIA</strong></p>
                                    <p class="signature-name">Nama Ketua Umum KADIN</p>
                                    <span class="signature-line"></span>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div class="footer-section">
                        <div class="qr-code-section">
                            ' . (!empty($qrCodeSrc) ? '<img src="' . $qrCodeSrc . '" alt="QR Code Verifikasi">' : '') . '
                            <div class="qr-code-label">Scan untuk Verifikasi</div>
                        </div>
                        <div class="legal-text">
                            Sertifikat ini diterbitkan secara elektronik dan dapat diverifikasi secara online di portal KADIN Indonesia.
                            <br>Untuk informasi lebih lanjut, kunjungi: <a href="https://your-portal.com" style="color:#888; text-decoration:none;">your-portal.com</a>
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

    $fileName = 'Sertifikat_SBU_' . str_replace(['/', '\\'], '_', $sbuNumber) . '.pdf';

    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . $fileName . '"'); 
    header('Cache-Control: public, must-revalidate, max-age=0');
    header('Pragma: public');
    header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
    echo $dompdf->output();
    exit;

} catch (Exception $e) {
    error_log("Error generating SBU PDF: " . $e->getMessage());
    ApiResponse::serverError('Gagal membuat sertifikat PDF: ' . $e->getMessage());
}