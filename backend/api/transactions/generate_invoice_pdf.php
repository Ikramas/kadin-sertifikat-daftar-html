<?php
require_once '../../error_handler.php';
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../classes/ApiResponse.php';
require_once '../../classes/JWT.php';
require_once '../../vendor/autoload.php'; // IMPORTANT: Load Composer autoloader

use Dompdf\Dompdf;
use Dompdf\Options;

// Ensure the request method is GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ApiResponse::error('Metode tidak diizinkan', 405);
}

try {
    // User authentication (assumed to be implemented and active in production)
    // $currentUser = JWT::requireAuth();

    // --- Dummy Data for Testing (REMEMBER TO REMOVE OR COMMENT OUT IN PRODUCTION) ---
    // This section is for development purposes only to simulate user and transaction data.
    $currentUser = ['user_id' => 1];
    $_GET['transaction_id'] = 1;
    // --- End Dummy Data ---

    $transactionId = $_GET['transaction_id'] ?? null;

    // Validate if transaction ID is provided
    if (!$transactionId) {
        ApiResponse::error('ID Transaksi tidak disediakan.', 400);
    }

    // Establish database connection
    $database = new Database();
    $db = $database->getConnection();

    // Fetch all necessary data for the invoice from the database
    $stmt = $db->prepare("
        SELECT
            t.transaction_number, t.amount, t.status, t.payment_method,
            t.payment_reference, t.paid_at, t.created_at, t.notes,
            u.name as user_name, u.email as user_email,
            c.company_name, c.address, c.city, c.postal_code, c.province,
            c.regency_city, c.district, c.village, c.company_phone, c.company_email,
            a.application_number, a.requested_classification, a.business_field,
            a.sub_bidang_code, a.bidang_name,
            -- Calculate expiration date as 7 days from creation date
            DATE_ADD(t.created_at, INTERVAL 7 DAY) as expired_at
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN companies c ON u.id = c.user_id
        LEFT JOIN applications a ON t.application_id = a.id
        WHERE t.id = ? AND t.user_id = ?;
    ");
    $stmt->execute([$transactionId, $currentUser['user_id']]);
    $transaction = $stmt->fetch(PDO::FETCH_ASSOC);

    // --- Fallback Dummy Data if database query returns no result (FOR TESTING ONLY) ---
    // This ensures a PDF can still be generated for design preview if the DB query fails.
    if (!$transaction) {
        $transaction = [
            'transaction_number' => 'INV-20250720', 'amount' => 500000, 'status' => 'pending',
            'payment_method' => 'virtual_account', 'payment_reference' => '89234729384723984',
            'paid_at' => null, 'created_at' => '2025-07-20 22:30:00',
            'expired_at' => '2025-07-27 22:30:00', 'notes' => 'Pembayaran biaya tahunan.',
            'user_name' => 'FRANS HITLER PANGABEAN', 'user_email' => 'frans.rgm@gmail.com',
            'company_name' => 'PT MARPAND SOLUSINDO', 'address' => 'JL HOS COKROAMINOTO NO 122',
            'city' => 'Jakarta Pusat', 'postal_code' => '10210', 'province' => 'DKI Jakarta',
            'regency_city' => 'Gambir', 'district' => 'Gambir', 'village' => 'Gambir',
            'company_phone' => '021-1234567', 'company_email' => 'contact@marpand.co.id',
            'application_number' => 'APP-SBU-00123', 'requested_classification' => 'Jasa Konstruksi',
            'business_field' => 'Bangunan Gedung', 'sub_bidang_code' => 'BG001', 'bidang_name' => 'Konstruksi Gedung Hunian'
        ];
    }
    // --- End Fallback Dummy Data ---

    // --- Prepare Data for PDF Template, ensuring proper escaping ---
    $invoiceNumber = htmlspecialchars($transaction['transaction_number']);
    $invoiceDate = htmlspecialchars(date('d F Y', strtotime($transaction['created_at'])));
    $dueDate = htmlspecialchars($transaction['expired_at'] ? date('d F Y', strtotime($transaction['expired_at'])) : 'Segera');
    $paidDate = htmlspecialchars($transaction['paid_at'] ? date('d F Y H:i', strtotime($transaction['paid_at'])) : 'N/A');

    $paymentStatusText = ($transaction['status'] === 'paid') ? 'LUNAS' : 'BELUM LUNAS';
    $statusColor = ($transaction['status'] === 'paid') ? '#008000' : '#CC0000'; // Green for paid, Red for unpaid

    $customerName = htmlspecialchars($transaction['user_name']);
    $customerEmail = htmlspecialchars($transaction['user_email']);
    $companyName = htmlspecialchars($transaction['company_name'] ?? 'N/A');

    // Concatenate address parts, filtering out empty ones
    $customerAddressParts = array_filter([
        $transaction['address'] ?? null,
        $transaction['village'] ?? null,
        $transaction['district'] ?? null,
        $transaction['regency_city'] ?? null,
        $transaction['province'] ?? null,
        $transaction['postal_code'] ?? null
    ]);
    $formattedAddress = implode(', ', array_map('htmlspecialchars', $customerAddressParts));

    // Construct item description based on available application data
    $itemDescription = 'Pembayaran Permohonan Sertifikasi SBU';
    if (!empty($transaction['application_number'])) {
        $itemDescription .= ' (No. ' . htmlspecialchars($transaction['application_number']) . ')';
    }
    if (!empty($transaction['bidang_name'])) {
        $itemDescription .= '<br><small style="color: #555;">Klasifikasi: ' . htmlspecialchars($transaction['bidang_name']) . ' (' . htmlspecialchars($transaction['sub_bidang_code']) . ')</small>';
    }

    $amountFormatted = 'Rp ' . number_format($transaction['amount'], 0, ',', '.');
    $notes = htmlspecialchars($transaction['notes'] ?? '-');

    // --- Generate Dynamic QR Code ---
    // Data to embed in the QR code (e.g., invoice details or a link).
    $qrCodeData = "Invoice ID: " . $invoiceNumber . "\nAmount: " . $amountFormatted . "\nStatus: " . $paymentStatusText . "\nURL: http://localhost/invoice_details/" . $transactionId; // Example URL, adjust as needed
    $qrCodeUrl = 'https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=' . urlencode($qrCodeData);

    // Attempt to fetch QR code image; fallback if unavailable
    $qrCodeImage = @file_get_contents($qrCodeUrl); // Using @ to suppress warnings
    $qrCodeSrc = '';
    if ($qrCodeImage === FALSE) {
        error_log("Failed to fetch QR code image from Google Charts API for transaction ID: " . $transactionId);
    } else {
        $qrCodeSrc = 'data:image/png;base64,' . base64_encode($qrCodeImage);
    }

    // --- Dompdf Configuration ---
    $options = new Options();
    $options->set('isHtml5ParserEnabled', true);
    $options->set('isRemoteEnabled', true); // Essential for loading remote images (like the logo or QR code)
    $options->set('defaultFont', 'Helvetica'); // Ensure font consistency

    $dompdf = new Dompdf($options);

    // --- HTML Content for PDF with refined CSS ---
    $html = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Faktur ' . $invoiceNumber . '</title>
        <style>
            /* --- Global Settings & Page --- */
            @page {
                margin: 0;
            }
            body {
                font-family: "Helvetica", sans-serif;
                margin: 0;
                font-size: 10pt; /* Base font size for consistency */
                line-height: 1.6; /* Slightly increased line height for readability */
                color: #333;
                background-color: #ffffff;
            }
            .invoice-wrapper {
                position: relative;
                min-height: 1123px; /* A4 height to help layout */
                box-sizing: border-box;
            }
            .invoice-container {
                padding: 40px;
                padding-bottom: 120px; /* Space for footer */
            }

            /* --- Header Section --- */
            .header-section {
                background-color: #2b006a; /* Deep Purple */
                color: #ffffff;
                padding: 30px 40px;
            }
            .header-table {
                width: 100%;
                border-collapse: collapse;
            }
            .header-table td {
                vertical-align: middle;
            }
            .logo {
                width: 120px; /* Consistent logo size */
                height: auto;
                filter: brightness(0) invert(1); /* Makes logo white */
            }
            .invoice-details {
                text-align: right;
            }
            .invoice-details h2 {
                margin: 0 0 5px 0;
                font-size: 14pt;
                font-weight: normal;
            }
            .invoice-details .invoice-number {
                font-size: 18pt; /* More prominent invoice number */
                font-weight: bold;
            }

            /* --- Main Content: Info Section --- */
            .info-section {
                padding: 30px 0;
                border-bottom: 1px solid #eeeeee;
                margin-bottom: 30px;
                width: 100%;
            }
            .info-table {
                width: 100%;
            }
            .info-table td {
                vertical-align: top;
                width: 50%;
                font-size: 10pt;
                padding: 0 5px;
            }
            .billing-to p {
                margin: 0 0 5px 0;
            }
            .billing-to strong {
                color: #2b006a;
            }
            .billing-to .address {
                font-size: 10pt;
                color: #555;
                margin-top: 5px;
                max-width: 300px; /* Ensures address doesn\'t get too wide */
            }

            /* Nested table for right-aligned invoice info */
            .invoice-info-table {
                float: right; /* Positions the table to the right within its parent cell */
                border-collapse: collapse;
            }
            .invoice-info-table td {
                text-align: left;
                padding: 0;
                padding-bottom: 8px; /* Slightly more space between rows */
                width: auto;
                font-size: 10pt;
            }
            .invoice-info-table .label {
                font-weight: bold;
                color: #555;
                padding-right: 15px; /* More space between label and value */
                white-space: nowrap;
            }

            /* --- Main Content: Items Table --- */
            .section-title {
                font-size: 14pt; /* Consistent size for section titles */
                font-weight: bold;
                color: #2b006a;
                margin-bottom: 15px;
                border-bottom: 2px solid #2b006a;
                padding-bottom: 8px;
            }
            .item-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            .item-table th, .item-table td {
                border-bottom: 1px solid #dddddd;
                padding: 12px 15px; /* Increased padding for better spacing */
                text-align: left;
                font-size: 10pt;
            }
            .item-table th {
                background-color: #f7f7f7;
                font-weight: bold;
                border-top: 1px solid #dddddd;
            }
            .item-table .description {
                width: 70%;
            }
            .item-table .amount {
                text-align: right;
            }
            .item-table tfoot td {
                border: none;
            }
            .total-row td {
                font-weight: bold;
                text-align: right;
                background-color: #f0f0f7;
                font-size: 14pt; /* Prominent total amount */
                color: #2b006a;
                padding: 18px 15px; /* More padding for total row */
                border-top: 2px solid #2b006a;
            }
            .total-label {
                text-align: left !important;
            }

            /* --- Notes Section --- */
            .notes-section {
                font-size: 10pt; /* Consistent font size for notes */
                color: #666;
                margin-top: 20px;
                margin-bottom: 20px;
            }
            .notes-section p {
                margin-top: 8px;
            }

            /* --- Barcode Section --- */
            .barcode-section {
                width: 100%;
                text-align: right;
                margin-top: 30px;
                margin-bottom: 40px;
                page-break-inside: avoid;
            }
            .barcode-section img {
                width: 150px; /* Slightly larger QR code for better scan-ability */
                height: 150px;
                display: block;
                margin-left: auto;
                margin-right: 0;
                border: 1px solid #eee; /* Subtle border for definition */
                padding: 5px;
            }
            .barcode-label {
                font-size: 9pt; /* Consistent label font size */
                color: #777;
                margin-top: 8px;
            }

            /* --- Footer Section --- */
            .footer-section {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                box-sizing: border-box;
                background-color: #f7f7f7;
                color: #555;
                padding: 20px 40px;
                text-align: center;
                font-size: 9pt; /* Consistent footer font size */
                border-top: 1px solid #e0e0e0;
            }
            .footer-section p {
                margin: 0 0 10px 0;
            }
            .footer-contact span {
                margin: 0 15px; /* More space between contact info */
            }
        </style>
    </head>
    <body>
        <div class="header-section">
            <table class="header-table">
                <tr>
                    <td>
                        <img src="data:image/svg+xml;base64,' . base64_encode(file_get_contents('http://www.kadin-sumsel.or.id/uploads/lhm/kadin-gold.png')) . '" alt="KADIN Logo" class="logo">
                    </td>
                    <td class="invoice-details">
                        <h2>Invoice Pembayaran</h2>
                        <div class="invoice-number">' . $invoiceNumber . '</div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="invoice-container">
            <div class="info-section">
                <table class="info-table">
                    <tr>
                        <td class="billing-to">
                            <p><strong>DITERBITKAN KEPADA:</strong></p>
                            <p>' . $customerName . '</p>
                            ' . ($companyName != 'N/A' ? '<p>' . $companyName . '</p>' : '') . '
                            ' . ($formattedAddress ? '<p class="address">' . $formattedAddress . '</p>' : '') . '
                            <p style="margin-top: 10px;">' . $customerEmail . '</p>
                        </td>
                        <td class="invoice-info">
                        <table class="invoice-info-table">
                            <tr>
                                <td class="label">Tanggal Invoice:</td>
                                <td>' . $invoiceDate . '</td>
                            </tr>
                            <tr>
                                <td class="label">Nomor Invoice:</td>
                                <td>' . $invoiceNumber . '</td>
                            </tr>
                            <tr>
                                <td class="label" style="padding-top: 10px;">Status:</td>
                                <td style="padding-top: 10px;"><strong style="color: ' . $statusColor . ';">' . $paymentStatusText . '</strong></td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="section-title">Rincian Pembayaran</div>
            <table class="item-table">
                <thead>
                    <tr>
                        <th class="description">Deskripsi</th>
                        <th class="amount">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>' . $itemDescription . '</td>
                        <td class="amount">' . $amountFormatted . '</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td class="total-label">TOTAL</td>
                        <td class="amount">' . $amountFormatted . '</td>
                    </tr>
                </tfoot>
            </table>

            ' . ($notes != '-' ? '
            <div class="notes-section">
                <strong>Catatan:</strong>
                <p>' . $notes . '</p>
            </div>' : '') . '

            ' . (!empty($qrCodeSrc) ? '
            <div class="barcode-section">
                <img src="' . $qrCodeSrc . '" alt="QR Code Faktur" class="qr-code">
                <div class="barcode-label">Scan untuk detail invoice</div>
            </div>' : '') . '

        </div>

        <div class="footer-section">
            <p>Terima kasih atas pembayaran Anda. Ini adalah faktur yang diterbitkan secara otomatis oleh sistem.</p>
            <div class="footer-contact">
                <span>Email: info@badansertifikasikadin.id</span> |
                <span>Website: www.badansertifikasikadin.id</span>
            </div>
        </div>
    </body>
    </html>';

    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();

    // Define the filename for the PDF
    $fileName = 'Faktur_' . str_replace(['/', '\\'], '_', $invoiceNumber) . '.pdf';

    // Set headers to display the PDF in the browser (inline) rather than forcing a download
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . $fileName . '"');
    echo $dompdf->output();
    exit;

} catch (Exception $e) {
    // Log the error for debugging purposes
    error_log("Error generating PDF for transaction ID " . ($transactionId ?? 'N/A') . ": " . $e->getMessage());
    // Return a user-friendly error response
    ApiResponse::serverError('Gagal membuat faktur PDF: ' . $e->getMessage());
}