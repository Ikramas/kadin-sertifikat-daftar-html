<?php
require_once __DIR__ . '/../error_handler.php';
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class OTPManager {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    public function generateOTP($email) {
        try {
            // Generate 6-digit OTP
            $otp = sprintf('%06d', mt_rand(0, 999999));
            $expires_at = date('Y-m-d H:i:s', time() + 600); // 10 minutes
            
            // Delete existing OTP for this email
            $stmt = $this->db->prepare("DELETE FROM otps WHERE email = ?");
            $stmt->execute([$email]);
            
            // Insert new OTP
            $stmt = $this->db->prepare("INSERT INTO otps (email, otp_code, expires_at, created_at) VALUES (?, ?, ?, NOW())");
            $stmt->execute([$email, password_hash($otp, PASSWORD_DEFAULT), $expires_at]);
            
            logApiRequest('OTP', 'generated', ['email' => $email]);
            
            return $otp;
        } catch (Exception $e) {
            logApiRequest('OTP', 'generation_failed', ['email' => $email], $e->getMessage());
            throw new Exception('Gagal membuat kode OTP: ' . $e->getMessage());
        }
    }
    
    public function sendOTP($email, $otp, $userName = '') {
        try {
            $mail = new PHPMailer(true);
            
            // Server settings
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = 'email@email.com'; // Ganti dengan email Anda
            $mail->Password   = 'janbabnsb';    // Ganti dengan app password Gmail Anda
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;
            
            // Recipients
            $mail->setFrom('kadin.indonesia.id@gmail.com', 'BSKI Portal');
            $mail->addAddress($email, $userName);
            
            // Content
            $mail->isHTML(true);
            $mail->Subject = 'Kode Verifikasi OTP - BSKI Portal';
            $mail->Body    = $this->getOTPEmailTemplate($otp, $userName);
            $mail->AltBody = "Kode verifikasi OTP Anda adalah: $otp. Kode ini berlaku selama 10 menit.";
            
            $mail->send();
            
            logApiRequest('OTP', 'sent', ['email' => $email]);
            
            return true;
        } catch (Exception $e) {
            logApiRequest('OTP', 'send_failed', ['email' => $email], $e->getMessage());
            throw new Exception('Gagal mengirim email OTP: ' . $e->getMessage());
        }
    }
    
    public function verifyOTP($email, $otp) {
        try {
            $stmt = $this->db->prepare("SELECT otp_code, expires_at FROM otps WHERE email = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([$email]);
            $result = $stmt->fetch();
            
            if (!$result) {
                logSecurityEvent('otp_not_found', "OTP not found for email: $email");
                throw new Exception('Kode OTP tidak ditemukan atau sudah digunakan');
            }
            
            if (strtotime($result['expires_at']) < time()) {
                logSecurityEvent('otp_expired', "Expired OTP for email: $email");
                throw new Exception('Kode OTP sudah kadaluarsa');
            }
            
            if (!password_verify($otp, $result['otp_code'])) {
                logSecurityEvent('otp_invalid', "Invalid OTP for email: $email");
                throw new Exception('Kode OTP tidak valid');
            }
            
            // Mark OTP as used
            $stmt = $this->db->prepare("UPDATE otps SET used = TRUE, used_at = NOW() WHERE email = ? AND used = FALSE");
            $stmt->execute([$email]);
            
            logApiRequest('OTP', 'verified', ['email' => $email]);
            
            return true;
        } catch (Exception $e) {
            logApiRequest('OTP', 'verification_failed', ['email' => $email], $e->getMessage());
            throw $e;
        }
    }
    
    private function getOTPEmailTemplate($otp, $userName) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Kode Verifikasi OTP</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                .otp-box { background: white; border: 2px solid #3b82f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
                .otp-code { font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 5px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>BSKI Portal</h1>
                    <p>Sistem Sertifikasi Badan Usaha Kadin Indonesia</p>
                </div>
                <div class='content'>
                    <h2>Halo " . ($userName ?: 'Pengguna') . ",</h2>
                    <p>Kami telah menerima permintaan verifikasi untuk akun Anda di BSKI Portal. Gunakan kode OTP berikut untuk melanjutkan:</p>
                    
                    <div class='otp-box'>
                        <div class='otp-code'>$otp</div>
                        <p><strong>Kode berlaku selama 10 menit</strong></p>
                    </div>
                    
                    <p><strong>Penting:</strong></p>
                    <ul>
                        <li>Jangan bagikan kode ini kepada siapa pun</li>
                        <li>Tim BSKI tidak akan pernah meminta kode OTP melalui telepon atau email</li>
                        <li>Jika Anda tidak melakukan permintaan ini, abaikan email ini</li>
                    </ul>
                    
                    <p>Terima kasih telah menggunakan layanan BSKI Portal.</p>
                    
                    <div class='footer'>
                        <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
                        <p>&copy; 2024 BSKI Portal - Kadin Indonesia</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}
