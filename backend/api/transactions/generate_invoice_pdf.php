<?php
// File: backend/api/transactions/generate_invoice_pdf.php

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
    $currentUser = JWT::requireAuth(); 

    $transactionNumber = $_GET['transaction_number'] ?? null;
    $applicationId = $_GET['application_id'] ?? null; 

    if (empty($transactionNumber) && empty($applicationId)) {
        ApiResponse::error('Nomor transaksi atau ID aplikasi wajib disediakan.', 400);
    }

    $database = new Database();
    $db = $database->getConnection();

    $invoiceData = null;
    if (!empty($transactionNumber)) {
        $stmt = $db->prepare("
            SELECT 
                t.id AS transaction_id, t.transaction_number, t.amount, t.status AS transaction_status, 
                t.payment_method, t.payment_reference, t.paid_at, t.expired_at, t.notes AS transaction_notes, t.created_at AS transaction_created_at,
                a.id AS application_id, a.application_number, a.requested_classification, a.business_field, a.company_qualification,
                a.application_type, a.sub_bidang_code, a.bidang_name,
                c.company_name, c.address, c.city, c.postal_code, c.province, c.regency_city, c.district, c.village,
                u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.uuid AS user_uuid
            FROM transactions t
            LEFT JOIN applications a ON t.application_id = a.id
            LEFT JOIN companies c ON a.company_id = c.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE t.transaction_number = ? AND (t.user_id = ? OR ? IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND id = ?))
            LIMIT 1;
        ");
        $stmt->execute([$transactionNumber, $currentUser['user_id'], $currentUser['user_id'], $currentUser['user_id']]);
        $invoiceData = $stmt->fetch(PDO::FETCH_ASSOC);
    } else if (!empty($applicationId)) {
        // Untuk preview, ambil data aplikasi dan user/company. Amount dan transaction_number diisi dummy.
        $stmt = $db->prepare("
            SELECT 
                a.id AS application_id, a.application_number, a.requested_classification, a.business_field, a.company_qualification,
                a.application_type, a.sub_bidang_code, a.bidang_name,
                c.company_name, c.address, c.city, c.postal_code, c.province, c.regency_city, c.district, c.village,
                u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.uuid AS user_uuid
            FROM applications a
            LEFT JOIN companies c ON a.company_id = c.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.id = ? AND (a.user_id = ? OR ? IN (SELECT id FROM users WHERE role IN ('admin', 'super_admin') AND id = ?))
            LIMIT 1;
        ");
        $stmt->execute([$applicationId, $currentUser['user_id'], $currentUser['user_id'], $currentUser['user_id']]);
        $invoiceData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($invoiceData) {
            $invoiceData['transaction_number'] = 'PREVIEW-INV-' . ($invoiceData['application_number'] ?? 'N/A');
            $invoiceData['amount'] = 25000000; // Harga contoh yang TIDAK NOL untuk preview
            $invoiceData['transaction_status'] = 'DRAFT';
            $invoiceData['transaction_created_at'] = date('Y-m-d H:i:s');
            $invoiceData['expired_at'] = date('Y-m-d H:i:s', strtotime('+7 days'));
            $invoiceData['paid_at'] = null;
            $invoiceData['payment_method'] = 'Bank Transfer';
            $invoiceData['payment_reference'] = 'PRVW000000';
            $invoiceData['transaction_notes'] = 'Ini adalah pratinjau invoice, harga dan nomor transaksi belum final.';
        }
    }

    if (!$invoiceData) {
        ApiResponse::notFound('Invoice atau Permohonan tidak ditemukan, atau Anda tidak memiliki akses.');
    }

    // --- Prepare Data for PDF Template, ensuring proper escaping ---
    $transactionNum = htmlspecialchars($invoiceData['transaction_number']);
    $amount = number_format($invoiceData['amount'], 0, ',', '.'); 
    $issueDate = date('d F Y', strtotime($invoiceData['transaction_created_at']));
    $dueDate = $invoiceData['expired_at'] ? date('d F Y', strtotime($invoiceData['expired_at'])) : 'Segera';
    $paidDate = $invoiceData['paid_at'] ? date('d F Y H:i', strtotime($invoiceData['paid_at'])) : 'N/A';

    $customerName = htmlspecialchars($invoiceData['user_name'] ?? 'N/A');
    $customerEmail = htmlspecialchars($invoiceData['user_email'] ?? 'N/A'); 
    $customerPhone = htmlspecialchars($invoiceData['user_phone'] ?? 'N/A');
    $companyName = htmlspecialchars($invoiceData['company_name'] ?? 'N/A');
    $notes = htmlspecialchars($invoiceData['transaction_notes'] ?? '-');
    
    // Status Pembayaran Teks & Warna
    $paymentStatusText = ($invoiceData['transaction_status'] === 'paid') ? 'LUNAS' : 'BELUM LUNAS';
    $statusColorClass = ($invoiceData['transaction_status'] === 'paid') ? 'paid' : 'unpaid'; 

    // Label Jenis Permohonan
    $applicationTypeLabel = '';
    if (isset($invoiceData['application_type'])) {
        switch ($invoiceData['application_type']) {
            case 'new': $applicationTypeLabel = 'Baru'; break;
            case 'renewal': $applicationTypeLabel = 'Perpanjangan'; break;
            case 'upgrade': $applicationTypeLabel = 'Peningkatan'; break;
            default: $applicationTypeLabel = $invoiceData['application_type'];
        }
    }

    // Item Description (Detail Perusahaan & Aplikasi)
    $itemDescription = 'Biaya Permohonan Sertifikasi SBU';
    if (!empty($invoiceData['application_number'])) {
        $itemDescription .= ' (No. ' . htmlspecialchars($invoiceData['application_number']) . ')';
    }
    // Menambahkan detail klasifikasi/bidang/subbidang secara lebih rapi
    $applicationDetails = [];
    if (!empty($invoiceData['requested_classification'])) {
        $applicationDetails[] = 'Klasifikasi: ' . htmlspecialchars($invoiceData['requested_classification']);
    }
    if (!empty($invoiceData['business_field'])) {
        $applicationDetails[] = 'Bidang: ' . htmlspecialchars($invoiceData['business_field']);
    }
    if (!empty($applicationDetails)) {
        $itemDescription .= '<br><span style="font-size: 0.85em; color: #666;">' . implode(' | ', $applicationDetails) . '</span>';
    }


    $customerAddressParts = array_filter([
        $invoiceData['address'] ?? null,
        $invoiceData['village'] ?? null,
        $invoiceData['district'] ?? null,
        $invoiceData['regency_city'] ?? null,
        $invoiceData['province'] ?? null,
        $invoiceData['postal_code'] ?? null
    ]);
    $formattedAddress = implode(', ', array_map('htmlspecialchars', $customerAddressParts));

    // Logo Paths
    $kadinLogoPath = ASSETS_IMAGES_DIR . 'kadin-logo.png'; 
    $kadinLogo = file_exists($kadinLogoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($kadinLogoPath)) : APP_BASE_URL . '/assets/kadin-logo.png'; 
    
    // Watermark Path (Pastikan gambar ini ada di ASSETS_IMAGES_DIR)
    $watermarkPath = ASSETS_IMAGES_DIR . 'kadin_watermark.png'; 
    $watermarkSrc = '';
    if (file_exists($watermarkPath)) {
        $watermarkSrc = 'data:image/png;base64,' . base64_encode(file_get_contents($watermarkPath));
    } else {
        ErrorLogger::logSystemError('watermark_image_not_found', 'Watermark image not found at: ' . $watermarkPath);
        // Fallback or warning if image is not found
    }

    // QR Code untuk verifikasi
    $qrCodeData = APP_BASE_URL . "/verify_transaction?trans_id=" . $transactionNum;
    if (!empty($invoiceData['application_id'])) {
        $qrCodeData = APP_BASE_URL . "/applications/detail/" . $invoiceData['application_number']; 
    }
    
    $qrCodeSrc = '';
    try {
        $qrCodeSrc = QRCodeGenerator::generateQRCodeAsDataURI($qrCodeData, 100, 'png'); 
    } catch (Exception $qrE) {
        ErrorLogger::logSystemError('qr_code_gen_invoice_failed', 'Failed to generate QR code for invoice: ' . $transactionNum . '. Error: ' . $qrE->getMessage());
    }

    // --- PENTING: Mengatur opsi Dompdf, termasuk margin halaman fisik PDF ke nol ---
    $options = new Options();
    $options->set('isHtml5ParserEnabled', true);
    $options->set('isRemoteEnabled', true); 
    $options->set('defaultFont', 'Inter'); 
    $options->set('chroot', realpath('../../'));
    
    // Ini yang akan mengatur margin fisik halaman menjadi nol (menempel rapat)
    $options->set('margin-top', 0);
    $options->set('margin-right', 0);
    $options->set('margin-bottom', 0);
    $options->set('margin-left', 0);

    $dompdf = new Dompdf($options);

    // --- HTML Content untuk PDF dengan Desain Terbaik ---
    // Pastikan konten di dalam HTML memiliki padding internal agar tidak menempel di dalam elemen
    $html = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Invoice ' . $transactionNum . '</title>
        <style>
            /* --- Global & Typography --- */
            @font-face {
                font-family: "Inter";
                font-style: normal;
                font-weight: 400;
                src: url("' . APP_BASE_URL . '/assets/fonts/Inter-Regular.ttf") format("truetype");
            }
            @font-face {
                font-family: "Inter";
                font-style: normal;
                font-weight: 700;
                src: url("' . APP_BASE_URL . '/assets/fonts/Inter-Bold.ttf") format("truetype");
            }
            
            /* --- PENTING: Atur HTML dan BODY agar tidak ada margin/padding bawaan sama sekali --- */
            html, body { 
                font-family: "Inter", "Helvetica Neue", "Helvetica", Arial, sans-serif; 
                font-size: 9pt; 
                margin: 0 !important; 
                padding: 0 !important;
                width: 100% !important; 
                height: 100% !important;
                box-sizing: border-box !important; 
            }

            /* --- PENTING: Atur aturan @page agar tidak ada margin halaman fisik dari CSS --- */
            @page {
                margin: 0 !important;
                padding: 0 !important;
            }

            h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; color: #2b006a; } 
            p { margin: 0 0 4px 0; } 
            strong { font-weight: 700; color: #2c3e50; } 
            small { font-size: 0.8em; color: #666; }

            /* --- Watermark --- */
            .watermark {
                position: fixed; 
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: url("' . htmlspecialchars($watermarkSrc) . '");
                background-repeat: no-repeat;
                background-position: center;
                background-size: 120% 120%; 
                opacity: 0.2; 
                z-index: -1; 
            }

            /* --- Layout Wrapper untuk Konten Utama --- */
            /* Ini akan menampung semua konten kecuali footer. Berikan padding-bottom untuk ruang footer. */
            .invoice-wrapper {
                max-width: 100% !important;
                box-shadow: none !important; 
                overflow: hidden !important; 
                position: relative !important; 
                margin: 0 !important;
                /* Berikan padding-bottom yang cukup agar konten tidak tumpang tindih dengan footer fixed */
                padding: 0 0 70px 0 !important; /* Contoh: 70px untuk ruang footer. SESUAIKAN JIKA TINGGI FOOTER BERUBAH! */
                width: 100% !important; 
                height: auto; /* Biarkan tinggi menyesuaikan konten */
                box-sizing: border-box !important; 
            }

            /* --- Header --- */
            .invoice-header {
                display: table;
                width: 100%; /* Ubah ini menjadi 100% jika ingin mengisi seluruh lebar wrapper */
                border-bottom: 3px solid #2b006a; 
                padding-bottom: 15px;
                padding-left: 30px; 
                padding-right: 30px; 
                padding-top: 30px; 
                box-sizing: border-box; 
                margin-top: 0 !important; 
            }
            .invoice-header .logo-col,
            .invoice-header .details-col {
                display: table-cell;
                vertical-align: middle; 
                width: 50%;
            }
            .invoice-header .logo-col { text-align: left; }
            .invoice-header .details-col { text-align: right; }
            .invoice-header .logo { max-width: 150px; height: auto; display: block; } 
            .invoice-header h1 {
                font-size: 26pt; 
                color: #2b006a;
                margin-bottom: 5px;
            }
            .invoice-header .invoice-number {
                font-size: 13pt; 
                font-weight: bold;
                color: #555;
            }
            .invoice-header p { font-size: 8.5pt; margin: 2px 0; } 

            /* --- Client/Company Info --- */
            .info-section {
                display: table;
                width: 100%;
                margin-bottom: 25px; 
                padding-left: 30px; 
                padding-right: 30px; 
                padding-top: 25px; 
                box-sizing: border-box;
                page-break-inside: avoid; 
            }
            .info-section .client-col,
            .info-section .invoice-info-col {
                display: table-cell;
                vertical-align: top;
                width: 50%;
                padding-bottom: 0px; 
            }
            .info-section .client-col p,
            .info-section .invoice-info-col p { margin: 0 0 3px 0; font-size: 9pt; } 
            .info-section .client-col strong { color: #2b006a; font-size: 10pt; }
            .info-section .invoice-info-col { text-align: right; }
            .info-section .invoice-info-col table {
                width: auto;
                float: right; 
                border-collapse: collapse;
            }
            .info-section .invoice-info-col table td {
                padding: 1px 0; 
                text-align: left;
                font-size: 9pt;
            }
            .info-section .invoice-info-col table td.label {
                font-weight: bold;
                color: #555;
                padding-right: 10px; 
                white-space: nowrap;
            }
            .status-badge {
                display: inline-block;
                padding: 3px 8px; 
                border-radius: 12px;
                margin-top: 8px;
                font-size: 8pt; 
                font-weight: bold;
                color: white;
                text-align: center;
                margin-left: 8px;
            }
            .status-badge.paid { background-color: #28a745; } 
            .status-badge.unpaid { background-color: #dc3545; } 

            /* --- Items Table --- */
            .section-title {
                font-size: 13pt;
                font-weight: bold;
                color: #2b006a;
                margin-bottom: 12px;
                border-bottom: 2px solid #2b006a;
                padding-bottom: 8px;
                padding-left: 30px; 
                padding-right: 30px; 
                box-sizing: border-box;
            }
            .item-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 25px; 
                page-break-inside: avoid; 
            }
            .item-table th, .item-table td {
                border-bottom: 1px solid #eeeeee;
                padding: 10px 15px; 
                text-align: left;
                font-size: 9.5pt; 
            }
            /* Menyesuaikan padding untuk th/td agar sama dengan padding section/container */
            .item-table th:first-child, .item-table td:first-child {
                padding-left: 30px; 
            }
            .item-table th:last-child, .item-table td:last-child {
                padding-right: 30px; 
            }

            .item-table th {
                background-color: #f7f7f7;
                font-weight: bold;
                border-top: 1px solid #dddddd;
            }
            .item-table .description-col { width: 70%; }
            .item-table .amount-col { text-align: right; width: 30%; font-weight: bold; color: #2b006a; } 
            
            .total-row td {
                font-weight: bold;
                text-align: right !important; 
                background-color: #f0f2f7; 
                font-size: 13pt; 
                color: #2b006a;
                padding: 15px 15px;
                border-top: 2px solid #2b006a;
            }
            /* Menyesuaikan padding untuk total row */
            .total-row td:first-child {
                padding-left: 30px;
            }
            .total-row td:last-child {
                padding-right: 30px;
            }

            /* --- Bottom Section (Notes & QR Code) --- */
            .bottom-section {
                display: table;
                width: 100%;
                margin-top: 25px; 
                padding-left: 30px; 
                padding-right: 30px; 
                box-sizing: border-box;
                page-break-inside: avoid; 
            }
            .bottom-section .notes-col,
            .bottom-section .qr-col {
                display: table-cell;
                vertical-align: top;
            }
            .bottom-section .notes-col { width: 70%; padding-right: 20px; }
            .bottom-section .qr-col { width: 30%; text-align: right; }
            .notes-section { font-size: 9pt; color: #666; } 
            .notes-section strong { color: #333; }
            .qr-code-img { 
                width: 100px; 
                height: 100px; 
                border: 1px solid #ddd; 
                padding: 3px; 
                background-color: #fff;
            }
            .qr-code-label { font-size: 7pt; color: #777; margin-top: 5px; text-align: center; } 

            /* --- FOOTER: Menggunakan position: fixed untuk menempel di bawah --- */
            .invoice-footer {
                position: fixed; /* Kunci untuk menempel di bawah halaman */
                bottom: 0 !important; /* Menempel ke bagian bawah */
                left: 0 !important; /* Menempel ke bagian kiri */
                width: 100% !important; /* Mengisi seluruh lebar halaman */
                text-align: center;
                font-size: 8pt; 
                color: #666;
                padding-top: 15px;
                padding-bottom: 30px; 
                /* Tambahkan padding horizontal agar teks tidak menempel ke tepi PDF */
                padding-left: 30px; 
                padding-right: 30px; 
                box-sizing: border-box !important; /* Penting! Memastikan padding dihitung dalam lebar 100% */
                border-top: 1px solid #e0e0e0;
                z-index: 1000; /* Pastikan di atas konten lain jika ada overlap */
            }
            .invoice-footer p { margin: 0 0 4px 0; }
            .invoice-footer a { color: #3498db; text-decoration: none; }
        </style>
    </head>
    <body>
        ' . (!empty($watermarkSrc) ? '<div class="watermark"></div>' : '') . '
        <div class="invoice-wrapper">
            <div class="invoice-header">
                <div class="logo-col">
                    <img src="' . htmlspecialchars($kadinLogo) . '" alt="KADIN Logo" class="logo">
                </div>
                <div class="details-col">
                    <h1>INVOICE</h1>
                    <p class="invoice-number">#' . $transactionNum . '</p>
                    <p>Tanggal: ' . $issueDate . '</p>
                    <p>Status: <span class="status-badge ' . $statusColorClass . '">' . $paymentStatusText . '</span></p>
                </div>
            </div>

            <div class="info-section">
                <div class="client-col">
                    <p><strong>DITERBITKAN KEPADA:</strong></p>
                    ' . ($companyName != 'N/A' ? '<p>' . $companyName . '</p>' : '') . '
                    ' . ($formattedAddress ? '<p class="address">' . $formattedAddress . '</p>' : '') . '
                    <p>Email: ' . $customerEmail . '</p>
                    <p>Telepon: ' . $customerPhone . '</p>
                </div>
                <div class="invoice-info-col">
                    <table>
                        <tr>
                            <td class="label">Nomor Permohonan:</td>
                            <td>' . htmlspecialchars($invoiceData['application_number'] ?? 'N/A') . '</td>
                        </tr>
                        <tr>
                            <td class="label">Jenis Permohonan:</td>
                            <td>' . htmlspecialchars($applicationTypeLabel) . '</td>
                        </tr>
                        
                        ' . ($invoiceData['transaction_status'] === 'paid' ? '
                        <tr>
                            <td class="label">Tanggal Dibayar:</td>
                            <td>' . $paidDate . '</td>
                        </tr>
                        <tr>
                            <td class="label">Metode Pembayaran:</td>
                            <td>' . htmlspecialchars(str_replace('_', ' ', strtoupper($invoiceData['payment_method']))) . '</td>
                        </tr>
                        ' : '') . '
                        ' . (!empty($invoiceData['payment_reference']) ? '
                        <tr>
                            <td class="label">No. Referensi:</td>
                            <td>' . htmlspecialchars($invoiceData['payment_reference']) . '</td>
                        </tr>' : '') . '
                    </table>
                </div>
            </div>

            <div class="section-title">RINCIAN PEMBAYARAN</div>
            <table class="item-table">
                <thead>
                    <tr>
                        <th class="description-col">Deskripsi</th>
                        <th class="amount-col">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="description-col">' . $itemDescription . '</td>
                        <td class="amount-col">Rp ' . $amount . '</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td class="total-label">TOTAL</td>
                        <td class="amount-col">Rp ' . $amount . '</td>
                    </tr>
                </tfoot>
            </table>

            <div class="bottom-section">
                <div class="notes-col">
                    ' . ($notes != '-' ? '
                    <div class="notes-section">
                        <strong>Catatan:</strong>
                        <p>' . $notes . '</p>
                    </div>' : '') . '
                    <div class="notes-section">
                        <strong>Informasi Pembayaran:</strong>
                        <p>Mohon lakukan pembayaran ke rekening [Nomor Rekening KADIN] - [Nama Bank] a.n. KADIN INDONESIA.</p>
                        <p>Invoice ini adalah bukti pembayaran biaya sertifikasi SBU.</p>
                        <p>Terima kasih atas pembayaran Anda.</p>
                    </div>
                </div>
                <div class="qr-col">
                    ' . (!empty($qrCodeSrc) ? '
                    <img src="' . $qrCodeSrc . '" alt="QR Code Invoice" class="qr-code-img">
                    <div class="qr-code-label">Scan untuk Verifikasi Invoice</div>' : '') . '
                </div>
            </div>
            
        </div>
        <div class="invoice-footer">
            <p>&copy; ' . date('Y') . ' BSKI Portal - Kadin Indonesia. Diterbitkan secara otomatis oleh sistem.</p>
            <p class="footer-contact">
                <span>Email: info@badansertifikasikadin.id</span> |
                <span>Website: ' . APP_BASE_URL . '</span>
            </p>
        </div>
    </body>
    </html>';

    $dompdf->loadHtml($html);
    $dompdf->render();

    // Hapus blok page_script yang sebelumnya kita coba untuk footer fixed
    // Karena sekarang footer ditangani oleh CSS position: fixed

    $fileName = 'Faktur_' . str_replace(['/', '\\'], '_', $transactionNum) . '.pdf';

    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . $fileName . '"'); 
    header('Cache-Control: public, must-revalidate, max-age=0');
    header('Pragma: public');
    header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
    
    // Penting: Pastikan tidak ada output lain sebelum Dompdf::output()
    if (ob_get_level()) {
        ob_end_clean();
    }
    
    echo $dompdf->output();
    exit;

} catch (Exception $e) {
    ErrorLogger::logSystemError('generate_invoice_pdf_error', $e->getMessage(), ['transaction_number' => $transactionNum ?? 'N/A', 'application_id' => $applicationId ?? 'N/A', 'user_id' => $currentUser['user_id'] ?? 'N/A']);
    ApiResponse::serverError('Gagal membuat faktur PDF: ' . $e->getMessage());
}