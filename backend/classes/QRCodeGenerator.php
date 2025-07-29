<?php
// File: backend/classes/QRCodeGenerator.php

// Hapus require_once __DIR__ . '/../vendor/autoload.php'; dari sini
// Hapus juga if (!class_exists('chillerlan\\QRCode\\Data\\QRDataMode')) { ... }

// Import kelas-kelas yang diperlukan dari pustaka QR Code
use chillerlan\QRCode\{QRCode, QRCodeException};
use chillerlan\QRCode\Data\QRDataMode; // <--- PASTIKAN BARIS INI ADA
use chillerlan\QRCode\Output\QROutputInterface;
use chillerlan\QRCode\QROptions;

class QRCodeGenerator {

    /**
     * Menghasilkan QR Code sebagai Data URI (base64 encoded string).
     * @param string $data Data yang akan di-encode ke QR Code.
     * @param int $size Ukuran QR Code dalam piksel.
     * @param string $format Format gambar ('png', 'jpg', 'gif', 'webp', 'svg').
     * @return string Data URI dari QR Code.
     * @throws Exception Jika terjadi kesalahan dalam pembuatan QR Code.
     */
    public static function generateQRCodeAsDataURI(string $data, int $size = 200, string $format = 'png'): string {
        try {
            // Options untuk QR Code
            $options = new QROptions([
                'outputType'  => $format === 'svg' ? QROutputInterface::MARKUP_SVG : QROutputInterface::GDIMAGE_PNG, // Pilih output type
                'eccLevel'    => QRCode::ECC_L, // Error Correction Level
                'scale'       => 5, // Skala untuk GDImage (png/jpg)
                'imageBase64' => true, // Output sebagai base64 string
                'imageTransparent' => false, // Latar belakang transparan
                'skipXmlDefinition' => true, // Hanya untuk SVG: Lewati deklarasi XML (jika di-embed di HTML)
                'dataMode'    => QRDataMode::MODE_AUTO, // Mode data otomatis
            ]);

            // Membuat instance QR Code dan menghasilkan output
            $qrcode = new QRCode($options);
            $dataURI = $qrcode->render($data);

            return $dataURI;

        } catch (QRCodeException $e) {
            // Tangani exception spesifik dari pustaka QR Code
            throw new Exception('Gagal membuat QR Code: ' . $e->getMessage());
        } catch (Exception $e) {
            // Tangani exception umum lainnya
            throw new Exception('Terjadi kesalahan tidak terduga saat membuat QR Code: ' . $e->getMessage());
        }
    }
}