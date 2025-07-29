<?php
// File: backend/classes/OTPManager.php
require_once __DIR__ . '/../error_handler.php';
require_once __DIR__ . '/../vendor/autoload.php'; // Pastikan composer autoload dimuat
require_once __DIR__ . '/../config/app.php'; // Untuk memuat env MAIL_USERNAME dll.
require_once __DIR__ . '/ErrorLogger.php'; // Pastikan ErrorLogger dimuat

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class OTPManager {
    private $db;
    private $mailerUsername;
    private $mailerPassword;
    private $mailerHost;
    private $mailerPort;
    private $mailerEncryption;
    private $fromEmail;
    private $fromName;
    
    public function __construct($database) {
        $this->db = $database;
        // --- PERBAIKAN KRITIS: Ambil kredensial dari variabel lingkungan ---
        $this->mailerUsername = $_ENV['MAIL_USERNAME'] ?? null; 
        $this->mailerPassword = $_ENV['MAIL_PASSWORD'] ?? null;    
        $this->mailerHost = $_ENV['MAIL_HOST'] ?? null;
        $this->mailerPort = $_ENV['MAIL_PORT'] ?? 587; // Default port
        // Default encryption: jika 'ssl' maka PHPMailer::ENCRYPTION_SMTPS, jika tidak PHPMailer::ENCRYPTION_STARTTLS
        $this->mailerEncryption = ($_ENV['MAIL_ENCRYPTION'] ?? 'tls') === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
        $this->fromEmail = $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@yourdomain.com'; // Default sender email
        $this->fromName = $_ENV['MAIL_FROM_NAME'] ?? 'BSKI Portal'; // Default sender name

        // Lakukan pengecekan setelah inisialisasi untuk logging
        if (empty($this->mailerUsername) || empty($this->mailerPassword) || empty($this->mailerHost)) {
            ErrorLogger::logSystemError('mailer_credentials_missing', 'Mailer credentials (username, password, or host) are not set in environment variables. Email sending may fail.');
            // Di lingkungan produksi, Anda mungkin ingin melempar Exception di sini
            // throw new Exception('Email service is not configured. Please contact administrator.');
        }
        // --- AKHIR PERBAIKAN KRITIS ---
    }
    
    public function generateOTP($email) {
        try {
            // Generate 6-digit OTP
            $otp = sprintf('%06d', mt_rand(0, 999999));
            $expires_at = date('Y-m-d H:i:s', time() + 600); // 10 minutes
            
            // Hapus OTP lama untuk email ini (jika belum digunakan atau sudah expired)
            // Ini untuk memastikan hanya ada satu OTP aktif per email
            $stmt = $this->db->prepare("DELETE FROM otps WHERE email = ? AND (used = FALSE OR expires_at < NOW())");
            $stmt->execute([$email]);
            
            // Insert new OTP
            $stmt = $this->db->prepare("INSERT INTO otps (email, otp_code, expires_at, created_at) VALUES (?, ?, ?, NOW())");
            $stmt->execute([$email, password_hash($otp, PASSWORD_DEFAULT), $expires_at]);
            
            if (function_exists('logApiRequest')) {
                 logApiRequest('OTP', 'generated', ['email' => $email], 'success');
            } else {
                 ErrorLogger::logSystemError('otp_generated_success', 'OTP generated for email.', ['email' => $email]);
            }
           
            return $otp;
        } catch (Exception $e) {
            if (function_exists('logApiRequest')) {
                logApiRequest('OTP', 'generation_failed', ['email' => $email], $e->getMessage());
            }
            ErrorLogger::logSystemError('otp_generation_failed', $e->getMessage(), ['email' => $email]);
            throw new Exception('Gagal membuat kode OTP: ' . $e->getMessage());
        }
    }
    
    public function sendOTP($email, $otp, $userName = '') {
        $mail = new PHPMailer(true);
        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host       = $this->mailerHost;
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->mailerUsername;
            $mail->Password   = $this->mailerPassword;
            $mail->SMTPSecure = $this->mailerEncryption;
            $mail->Port       = $this->mailerPort;
            $mail->CharSet    = 'UTF-8'; // Tambahkan charset untuk karakter khusus
            $mail->isHTML(true); // Set email format to HTML
            
            // Debugging (Hanya aktifkan di dev, jangan di prod!)
            // $mail->SMTPDebug = SMTP::DEBUG_SERVER; 

            // Recipients
            $mail->setFrom($this->fromEmail, $this->fromName);
            $mail->addAddress($email, $userName);
            
            // Content
            $mail->Subject = 'Kode Verifikasi OTP - BSKI Portal';
            $mail->Body    = $this->getOTPEmailTemplate($otp, $userName);
            $mail->AltBody = "Kode verifikasi OTP Anda adalah: $otp. Kode ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapa pun. Jika Anda tidak melakukan permintaan ini, abaikan email ini.";
            
            $mail->send();
            
            if (function_exists('logApiRequest')) {
                logApiRequest('OTP', 'sent', ['email' => $email], 'success');
            } else {
                ErrorLogger::logSystemError('otp_sent_success', 'OTP email sent to ' . $email, ['email' => $email]);
            }
            
            return true;
        } catch (Exception $e) {
            $errorMessage = $e->getMessage();
            // Lebih detail tentang error PHPMailer
            if ($mail->ErrorInfo) {
                $errorMessage .= " PHPMailer Error: " . $mail->ErrorInfo;
            }
            
            if (function_exists('logApiRequest')) {
                 logApiRequest('OTP', 'send_failed', ['email' => $email], $errorMessage);
            }
            ErrorLogger::logSystemError('otp_send_failed', $errorMessage, ['email' => $email]);
            throw new Exception('Gagal mengirim email OTP. Mohon pastikan kredensial email di server sudah benar dan coba lagi nanti.');
        }
    }
    
    public function verifyOTP($email, $otp) {
        try {
            // Ambil OTP terbaru yang belum digunakan
            $stmt = $this->db->prepare("SELECT otp_code, expires_at FROM otps WHERE email = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([$email]);
            $result = $stmt->fetch();
            
            if (!$result) {
                ErrorLogger::logSecurityEvent('otp_not_found', "OTP not found for email: $email");
                throw new Exception('Kode OTP tidak ditemukan atau sudah digunakan');
            }
            
            if (strtotime($result['expires_at']) < time()) {
                ErrorLogger::logSecurityEvent('otp_expired', "Expired OTP for email: $email");
                // Tandai OTP ini sebagai expired
                $stmt = $this->db->prepare("UPDATE otps SET used = TRUE, used_at = NOW() WHERE email = ? AND otp_code = ? AND used = FALSE"); 
                $stmt->execute([$email, $result['otp_code']]);
                throw new Exception('Kode OTP sudah kadaluarsa');
            }
            
            if (!password_verify($otp, $result['otp_code'])) {
                ErrorLogger::logSecurityEvent('otp_invalid', "Invalid OTP for email: $email");
                throw new Exception('Kode OTP tidak valid');
            }
            
            // Mark OTP as used
            $stmt = $this->db->prepare("UPDATE otps SET used = TRUE, used_at = NOW() WHERE email = ? AND otp_code = ? AND used = FALSE");
            $stmt->execute([$email, $result['otp_code']]); 
            
            if (function_exists('logApiRequest')) {
                logApiRequest('OTP', 'verified', ['email' => $email], 'success');
            } else {
                ErrorLogger::logSystemError('otp_verified_success', 'OTP verified for email.', ['email' => $email]);
            }
            
            return true;
        } catch (Exception $e) {
            if (function_exists('logApiRequest')) {
                logApiRequest('OTP', 'verification_failed', ['email' => $email], $e->getMessage());
            }
            ErrorLogger::logSystemError('otp_verification_failed', $e->getMessage(), ['email' => $email]);
            throw $e; 
        }
    }
    
    // Template HTML untuk email OTP
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
                    <h2>Halo " . htmlspecialchars($userName ?: 'Pengguna') . ",</h2>
                    <p>Kami telah menerima permintaan verifikasi untuk akun Anda di BSKI Portal. Gunakan kode OTP berikut untuk melanjutkan:</p>
                    
                    <div class='otp-box'>
                        <div class='otp-code'>" . htmlspecialchars($otp) . "</div>
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