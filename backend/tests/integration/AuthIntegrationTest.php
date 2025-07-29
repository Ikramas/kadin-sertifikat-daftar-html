<?php
// backend/tests/integration/AuthIntegrationTest.php

use PHPUnit\Framework\TestCase;
use App\ApiResponse;
use App\Database;
use App\SecurityManager;
use App\OTPManager; // Gunakan OTPManager asli, tapi pastikan tidak mengirim email
use App\Api\Auth; // Pastikan namespace sesuai
use PDO;

// Memuat helper stream untuk mocking php://input
require_once __DIR__ . '/../TempPhpStream.php';

class AuthIntegrationTest extends TestCase
{
    private $pdo; // Koneksi ke database test
    private $initialUser = [
        'email' => 'integration_test@example.com',
        'password' => 'SecurePass123!',
        'status' => 'active',
        'role_id' => 1, // Asumsi role_id 1 untuk 'user'
        'phone' => '081234567890'
    ];
    private $initialCompany = [
        'name' => 'PT Test Integrasi',
        'npwp' => '123456789012345',
        'nib' => '123456789012345678',
        'address' => 'Jl. Test No. 123',
        'phone' => '081234567890',
        'email' => 'company@example.com',
        'status' => 'pending_admin_approval',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Setup Koneksi Database Test
        $dbHost = getenv('DB_HOST');
        $dbName = getenv('DB_NAME');
        $dbUser = getenv('DB_USER');
        $dbPass = getenv('DB_PASS');

        try {
            $this->pdo = new PDO("mysql:host={$dbHost};dbname={$dbName}", $dbUser, $dbPass);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->pdo->exec("SET NAMES utf8mb4");
        } catch (\PDOException $e) {
            $this->fail("Failed to connect to test database '{$dbName}': " . $e->getMessage());
        }

        // 2. Bersihkan dan Isi Database Test dengan Data Awal
        $this->cleanDatabase();
        $this->seedDatabase();

        // 3. Set ApiResponse ke Test Mode dan mock ErrorLogger
        ApiResponse::setTestMode(true);
        ApiResponse::setMockErrorLogger($this->createMock(App\ErrorLogger::class)); // Mock logger for ApiResponse
        App\ErrorLogger::setMock($this->createMock(App\ErrorLogger::class)); // Mock logger for direct calls

        // 4. Set global $_SERVER untuk method POST (untuk request body)
        $_SERVER['REQUEST_METHOD'] = 'POST';

        // Inisialisasi session untuk CSRF
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->cleanDatabase(); // Bersihkan setelah setiap tes
        $this->pdo = null; // Tutup koneksi PDO

        // Reset ApiResponse mode
        ApiResponse::setTestMode(false);
        ApiResponse::setMockErrorLogger(null);
        App\ErrorLogger::resetMock();

        // Hapus session dan mock stream
        if (session_status() == PHP_SESSION_ACTIVE) {
            session_destroy();
        }
        if (defined('TEST_INPUT_STREAM')) {
            fclose(TEST_INPUT_STREAM);
            if (in_array('php', stream_get_wrappers())) {
                stream_wrapper_unregister('php');
            }
        }
    }

    private function cleanDatabase()
    {
        // Pastikan urutan DELETE sesuai dengan foreign key constraints
        $this->pdo->exec("DELETE FROM jwt_blacklist");
        $this->pdo->exec("DELETE FROM security_logs");
        $this->pdo->exec("DELETE FROM documents");
        $this->pdo->exec("DELETE FROM notifications");
        $this->pdo->exec("DELETE FROM applications");
        $this->pdo->exec("DELETE FROM transactions");
        $this->pdo->exec("DELETE FROM certificates");
        $this->pdo->exec("DELETE FROM company_kta_kadin_members");
        $this->pdo->exec("DELETE FROM company_legal_entities");
        $this->pdo->exec("DELETE FROM company_leaders");
        $this->pdo->exec("DELETE FROM companies");
        $this->pdo->exec("DELETE FROM user_settings");
        $this->pdo->exec("DELETE FROM otp_codes"); // Pastikan tabel OTP ada
        $this->pdo->exec("DELETE FROM users");
        $this->pdo->exec("DELETE FROM roles"); // Hapus role terakhir
    }

    private function seedDatabase()
    {
        // Hash password untuk user awal
        $this->initialUser['password_hash'] = SecurityManager::hashPassword($this->initialUser['password']);

        // Insert default roles if they don't exist
        $stmt = $this->pdo->prepare("INSERT IGNORE INTO roles (id, name, description) VALUES (1, 'user', 'Standard user'), (2, 'admin', 'Administrator user'), (3, 'super_admin', 'Super Administrator user')");
        $stmt->execute();

        // Insert user
        $stmt = $this->pdo->prepare("INSERT INTO users (email, password_hash, status, role_id, phone, created_at, updated_at) VALUES (:email, :password_hash, :status, :role_id, :phone, NOW(), NOW())");
        $stmt->execute([
            ':email' => $this->initialUser['email'],
            ':password_hash' => $this->initialUser['password_hash'],
            ':status' => $this->initialUser['status'],
            ':role_id' => $this->initialUser['role_id'],
            ':phone' => $this->initialUser['phone']
        ]);
        $this->initialUser['id'] = $this->pdo->lastInsertId();

        // Insert company associated with the user
        $stmt = $this->pdo->prepare("INSERT INTO companies (user_id, name, npwp, nib, address, phone, email, status, created_at, updated_at) VALUES (:user_id, :name, :npwp, :nib, :address, :phone, :email, :status, NOW(), NOW())");
        $stmt->execute(array_merge($this->initialCompany, ['user_id' => $this->initialUser['id']]));
        $this->initialCompany['id'] = $this->pdo->lastInsertId();
    }

    /**
     * Helper to mock php://input
     * @param array $data The data to be encoded as JSON for php://input
     */
    private function mockPhpInput(array $data)
    {
        $content = json_encode($data);
        $tempStream = fopen('php://temp', 'r+');
        fwrite($tempStream, $content);
        rewind($tempStream);

        if (in_array('php', stream_get_wrappers())) {
            stream_wrapper_unregister('php');
        }
        stream_wrapper_register('php', TempPhpStream::class);
        define('TEST_INPUT_STREAM', $tempStream);
    }

    /**
     * Test case for successful user login integration.
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testLoginSuccessfulIntegration()
    {
        $email = $this->initialUser['email'];
        $password = $this->initialUser['password'];
        $csrfToken = 'test_integration_csrf';
        $_SESSION['csrf_token'] = $csrfToken; // Set session CSRF token

        $this->mockPhpInput([
            'email' => $email,
            'password' => $password,
            'csrf_token' => $csrfToken
        ]);

        $authController = new Auth(new Database()); // Gunakan Database nyata

        try {
            $authController->handleRequest('login');
            $this->fail("Expected RuntimeException from ApiResponse::success was not thrown.");
        } catch (\RuntimeException $e) {
            $this->assertEquals('ApiResponse::success called', $e->getMessage());

            $response = ApiResponse::$lastResponse;
            $this->assertEquals('success', $response['status']);
            $this->assertEquals('Login berhasil.', $response['message']);
            $this->assertArrayHasKey('token', $response['data']);
            $this->assertArrayHasKey('csrf_token', $response);

            // Verifikasi token JWT (decode saja untuk memeriksa payload, tidak perlu validasi penuh)
            $tokenParts = explode('.', $response['data']['token']);
            $this->assertCount(3, $tokenParts);
            $decodedPayload = json_decode(base64_decode($tokenParts[1]), true);
            $this->assertEquals($this->initialUser['id'], $decodedPayload['user_id']);
            $this->assertEquals($email, $decodedPayload['email']);

            // Verifikasi CSRF token baru di-generate dan disimpan di session
            $this->assertNotEquals($csrfToken, $response['csrf_token']);
            $this->assertEquals($response['csrf_token'], $_SESSION['csrf_token']);

            // Verifikasi Security Log di DB (jika Anda ingin test log ke DB)
            $stmt = $this->pdo->prepare("SELECT * FROM security_logs WHERE event_type = 'BRUTE_FORCE_ATTEMPT' AND identifier = :ip");
            $stmt->execute([':ip' => $_SERVER['REMOTE_ADDR']]);
            $this->assertEmpty($stmt->fetch(), "Brute force log should be cleared on successful login.");
        }
    }

    /**
     * Test case for login with invalid password integration.
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testLoginInvalidPasswordIntegration()
    {
        $email = $this->initialUser['email'];
        $wrongPassword = 'WrongPassword123';
        $csrfToken = 'test_integration_csrf';
        $_SESSION['csrf_token'] = $csrfToken;

        $this->mockPhpInput([
            'email' => $email,
            'password' => $wrongPassword,
            'csrf_token' => $csrfToken
        ]);

        $authController = new Auth(new Database());

        try {
            $authController->handleRequest('login');
            $this->fail("Expected RuntimeException from ApiResponse::error was not thrown.");
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('ApiResponse::error called with status 401', $e->getMessage());

            $response = ApiResponse::$lastResponse;
            $this->assertEquals('error', $response['status']);
            $this->assertEquals('Email atau kata sandi tidak sesuai.', $response['message']);
            $this->assertEquals('UNAUTHORIZED', $response['code']);

            // Verifikasi security log for failed login (cek DB)
            $stmt = $this->pdo->prepare("SELECT * FROM security_logs WHERE event_type = 'LOGIN_ATTEMPT_FAILED' AND identifier = :ip");
            $stmt->execute([':ip' => $_SERVER['REMOTE_ADDR']]);
            $log = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->assertNotEmpty($log);
            $this->assertEquals('LOGIN_ATTEMPT_FAILED', $log['event_type']);
        }
    }

    /**
     * Test case for successful user registration integration.
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testRegisterNewUserSuccessIntegration()
    {
        $newEmail = 'new_user_reg@example.com';
        $newPassword = 'NewSecurePassReg!';
        $newPhone = '08111222333';
        $newCompanyName = 'PT Inovasi Baru';
        $newNpwp = '987654321098765';
        $newNib = '987654321098765432';
        $csrfToken = 'test_register_csrf';
        $_SESSION['csrf_token'] = $csrfToken;

        $this->mockPhpInput([
            'email' => $newEmail,
            'phone' => $newPhone,
            'password' => $newPassword,
            'confirm_password' => $newPassword,
            'company_name' => $newCompanyName,
            'company_npwp' => $newNpwp,
            'company_nib' => $newNib,
            'company_address' => 'Jl. Register Baru No. 10',
            'csrf_token' => $csrfToken
        ]);

        // Mock OTPManager::sendOTP() to prevent actual email sending
        // This is a common pattern for integration tests to prevent side effects
        $otpManagerMock = $this->createMock(App\OTPManager::class);
        $otpManagerMock->method('sendOTP')->willReturn(true);
        // OTPManager constructor in Auth uses the real Database, so we need to mock sendOTP().
        // For a true integration, you'd test mail sending via a local SMTP server or capture library output.

        // This requires a way to inject the mocked OTPManager into Auth controller.
        // If OTPManager is directly instantiated inside Auth's methods,
        // you might need to use Reflection or refactor Auth for better dependency injection.
        // For this example, let's assume Auth's constructor takes OTPManager or a setter exists.
        // If not, this part becomes a 'functional' test where you expect sendOTP to be called
        // but it won't actually send emails because mail config might be dummy in test env.

        $authController = new Auth(new Database()); // Menggunakan koneksi DB nyata
        // Jika OTPManager di-inject: $authController = new Auth(new Database(), $otpManagerMock);

        try {
            $authController->handleRequest('register');
            $this->fail("Expected RuntimeException from ApiResponse::success was not thrown.");
        } catch (\RuntimeException $e) {
            $this->assertEquals('ApiResponse::success called', $e->getMessage());

            $response = ApiResponse::$lastResponse;
            $this->assertEquals('success', $response['status']);
            $this->assertStringContainsString('Pendaftaran berhasil', $response['message']);

            // Verify user and company created in DB
            $stmt = $this->pdo->prepare("SELECT id, email, status FROM users WHERE email = :email");
            $stmt->execute([':email' => $newEmail]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->assertNotEmpty($user);
            $this->assertEquals('pending_verification', $user['status']); // Status setelah register
            $userId = $user['id'];

            $stmt = $this->pdo->prepare("SELECT name, npwp, nib FROM companies WHERE user_id = :user_id");
            $stmt->execute([':user_id' => $userId]);
            $company = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->assertNotEmpty($company);
            $this->assertEquals($newCompanyName, $company['name']);
            $this->assertEquals($newNpwp, $company['npwp']);

            // Verify OTP was stored in DB (assuming 'otp_codes' table)
            $stmt = $this->pdo->prepare("SELECT * FROM otp_codes WHERE user_id = :user_id AND is_used = 0");
            $stmt->execute([':user_id' => $userId]);
            $otp = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->assertNotEmpty($otp);
            $this->assertNotNull($otp['otp_hash']);
            $this->assertGreaterThan(time(), strtotime($otp['expires_at']));
        }
    }

    // --- Tambahkan lebih banyak tes integrasi lainnya di sini ---
    // testVerifyOtpSuccessfulIntegration
    // testVerifyOtpInvalidIntegration
    // testLogoutIntegration
    // testRefreshTokenIntegration
    // testRegisterExistingEmailIntegration
    // dll.
}