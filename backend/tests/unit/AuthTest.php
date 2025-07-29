<?php
// backend/tests/unit/AuthTest.php

use PHPUnit\Framework\TestCase;
use App\ApiResponse;
use App\Database;
use App\SecurityManager;
use App\JWT;
use App\CSRFProtection;
use App\OTPManager;
use App\ErrorLogger;
use App\Api\Auth; // Pastikan namespace sesuai dengan konfigurasi composer.json App\Api\

// Memuat helper stream untuk mocking php://input
require_once __DIR__ . '/../TempPhpStream.php';

class AuthTest extends TestCase
{
    private $dbMock;
    private $securityManagerMock;
    private $jwtMock;
    private $csrfProtectionMock;
    private $otpManagerMock;
    private $errorLoggerMock;
    private $inputData; // Untuk menyimpan input yang di-mock

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Mocking Dependensi
        // Kita membuat mock untuk setiap kelas yang berinteraksi dengan Auth
        $this->dbMock = $this->createMock(Database::class);
        $this->securityManagerMock = $this->createMock(SecurityManager::class);
        $this->jwtMock = $this->createMock(JWT::class);
        $this->csrfProtectionMock = $this->createMock(CSRFProtection::class);
        $this->otpManagerMock = $this->createMock(OTPManager::class);
        $this->errorLoggerMock = $this->createMock(ErrorLogger::class); // Mock ErrorLogger itu sendiri

        // 2. Set mode testing untuk ApiResponse dan ErrorLogger
        ApiResponse::setTestMode(true);
        ApiResponse::setMockErrorLogger($this->errorLoggerMock); // Suntikkan mock ErrorLogger ke ApiResponse
        ErrorLogger::setMock($this->errorLoggerMock); // Suntikkan mock ErrorLogger ke ErrorLogger itu sendiri (untuk panggilan langsung)

        // 3. Set global $_SERVER untuk method POST
        $_SERVER['REQUEST_METHOD'] = 'POST';

        // Inisialisasi inputData ke null agar bisa disiapkan per tes
        $this->inputData = null;
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        // Clear global state if modified for tests
        unset($_SERVER['REQUEST_METHOD']);
        unset($_SESSION['csrf_token']); // Pastikan session csrf_token bersih

        // Reset mode testing untuk ApiResponse dan ErrorLogger
        ApiResponse::setTestMode(false);
        ApiResponse::setMockErrorLogger(null);
        ErrorLogger::resetMock();

        // Hapus mock stream jika sudah ada
        if (defined('TEST_INPUT_STREAM')) {
            fclose(TEST_INPUT_STREAM);
            // Hanya unregister jika sebelumnya sudah register
            if (in_array('php', stream_get_wrappers())) { // Periksa apakah sudah teregister
                stream_wrapper_unregister('php');
            }
        }
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

        // Jika sudah teregister, unregister dulu untuk menghindari error
        if (in_array('php', stream_get_wrappers())) {
            stream_wrapper_unregister('php');
        }
        stream_wrapper_register('php', TempPhpStream::class);
        define('TEST_INPUT_STREAM', $tempStream);
    }

    /**
     * Test case for successful user login.
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testLoginSuccess()
    {
        $email = 'test@example.com';
        $password = 'password123';
        $csrfToken = 'test_csrf_token';
        $_SESSION['csrf_token'] = $csrfToken; // Set session CSRF token

        // Mocking php://input
        $this->mockPhpInput([
            'email' => $email,
            'password' => $password,
            'csrf_token' => $csrfToken
        ]);

        // Configure mocks for expected behavior
        $this->csrfProtectionMock->method('validateToken')->willReturn(true);
        $this->securityManagerMock->method('preventBruteForce')->willReturn(null);
        $this->securityManagerMock->method('sanitizeInput')->will($this->returnArgument(0)); // Input sanitized as is
        $this->securityManagerMock->method('verifyPassword')->willReturn(true);
        $this->securityManagerMock->method('resetBruteForce')->willReturn(null);

        // Mock PDOStatement for database queries
        $stmtMock = $this->createMock(\PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);
        // First fetch for user data, second for role name
        $stmtMock->method('fetch')->willReturnOnConsecutiveCalls(
            [
                'id' => 1,
                'email' => $email,
                'password_hash' => password_hash($password, PASSWORD_ARGON2ID),
                'status' => 'active',
                'role_id' => 1,
                'company_id' => 101
            ],
            ['name' => 'user']
        );
        $this->dbMock->method('getConnection')->willReturnSelf();
        $this->dbMock->method('prepare')->willReturn($stmtMock);

        $this->jwtMock->method('encode')->willReturn('mock_jwt_token_abcdef123');
        $this->csrfProtectionMock->method('generateToken')->willReturn('new_csrf_token_xyz');

        // Expect specific log calls
        $this->errorLoggerMock->expects($this->once())
                               ->method('logMethodCalled')
                               ->with('api_requests', 'SUCCESS', 'Login berhasil.', $this->callback(function($context) use ($email) {
                                    return $context['status_code'] === 200 &&
                                           $context['response_data']['user']['email'] === $email;
                               }));

        // Expect that ApiResponse::success is called and stops execution
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('ApiResponse::success called');

        // Create an instance of Auth with mocked dependencies
        $authController = new Auth($this->dbMock);

        // Execute the handleRequest method for 'login' action
        $authController->handleRequest('login');

        // Assert on the captured ApiResponse content
        $response = ApiResponse::$lastResponse;
        $this->assertEquals('success', $response['status']);
        $this->assertEquals('Login berhasil.', $response['message']);
        $this->assertEquals($email, $response['data']['user']['email']);
        $this->assertEquals('mock_jwt_token_abcdef123', $response['data']['token']);
        $this->assertEquals('new_csrf_token_xyz', $response['csrf_token']);
    }

    /**
     * Test case for login with invalid credentials.
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testLoginInvalidCredentials()
    {
        $email = 'nonexistent@example.com';
        $password = 'wrongpassword';
        $csrfToken = 'test_csrf_token';
        $_SESSION['csrf_token'] = $csrfToken;

        $this->mockPhpInput([
            'email' => $email,
            'password' => $password,
            'csrf_token' => $csrfToken
        ]);

        $this->csrfProtectionMock->method('validateToken')->willReturn(true);
        $this->securityManagerMock->method('preventBruteForce')->willReturn(null);
        $this->securityManagerMock->method('sanitizeInput')->will($this->returnArgument(0));

        // Mock database to return no user found
        $stmtMock = $this->createMock(\PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);
        $stmtMock->method('fetch')->willReturn(false); // No user found
        $this->dbMock->method('getConnection')->willReturnSelf();
        $this->dbMock->method('prepare')->willReturn($stmtMock);

        // Expect security log for failed attempt
        $this->errorLoggerMock->expects($this->once())
                               ->method('logMethodCalled')
                               ->with('security_events', 'WARNING', 'Invalid credentials attempt', $this->callback(function($context) use ($email) {
                                    return $context['email'] === $email;
                               }));

        // Expect that ApiResponse::unauthorized is called
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('ApiResponse::error called with status 401');

        $authController = new Auth($this->dbMock);
        $authController->handleRequest('login');

        // Assert on the captured ApiResponse content
        $response = ApiResponse::$lastResponse;
        $this->assertEquals('error', $response['status']);
        $this->assertEquals('Email atau kata sandi tidak sesuai.', $response['message']);
        $this->assertEquals('UNAUTHORIZED', $response['code']);
    }

    /**
     * Test case for login with missing email.
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testLoginMissingEmail()
    {
        $password = 'password123';
        $csrfToken = 'test_csrf_token';
        $_SESSION['csrf_token'] = $csrfToken;

        $this->mockPhpInput([
            'password' => $password,
            'csrf_token' => $csrfToken
        ]);

        $this->csrfProtectionMock->method('validateToken')->willReturn(true);
        $this->securityManagerMock->method('preventBruteForce')->willReturn(null);
        $this->securityManagerMock->method('sanitizeInput')->will($this->returnArgument(0));

        // Expect ApiResponse::validation error
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('ApiResponse::error called with status 422');

        $authController = new Auth($this->dbMock);
        $authController->handleRequest('login');

        $response = ApiResponse::$lastResponse;
        $this->assertEquals('error', $response['status']);
        $this->assertEquals('Format email tidak valid.', $response['message']);
        $this->assertEquals('VALIDATION_ERROR', $response['code']);
        $this->assertEquals(['field' => 'email'], $response['details']);
    }

    /**
     * Test case for login with suspended account.
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testLoginSuspendedAccount()
    {
        $email = 'suspended@example.com';
        $password = 'password123';
        $csrfToken = 'test_csrf_token';
        $_SESSION['csrf_token'] = $csrfToken;

        $this->mockPhpInput([
            'email' => $email,
            'password' => $password,
            'csrf_token' => $csrfToken
        ]);

        $this->csrfProtectionMock->method('validateToken')->willReturn(true);
        $this->securityManagerMock->method('preventBruteForce')->willReturn(null);
        $this->securityManagerMock->method('sanitizeInput')->will($this->returnArgument(0));
        $this->securityManagerMock->method('verifyPassword')->willReturn(true);

        // Mock database to return suspended user
        $stmtMock = $this->createMock(\PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);
        $stmtMock->method('fetch')->willReturnOnConsecutiveCalls(
            [
                'id' => 2,
                'email' => $email,
                'password_hash' => password_hash($password, PASSWORD_ARGON2ID),
                'status' => 'suspended',
                'role_id' => 1,
                'company_id' => 102
            ],
            ['name' => 'user']
        );
        $this->dbMock->method('getConnection')->willReturnSelf();
        $this->dbMock->method('prepare')->willReturn($stmtMock);

        // Expect ApiResponse::forbidden error
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('ApiResponse::error called with status 403');

        $authController = new Auth($this->dbMock);
        $authController->handleRequest('login');

        $response = ApiResponse::$lastResponse;
        $this->assertEquals('error', $response['status']);
        $this->assertEquals('Akun Anda telah ditangguhkan. Silakan hubungi administrator.', $response['message']);
        $this->assertEquals('FORBIDDEN', $response['code']);
        $this->assertEquals(['user_status' => 'suspended'], $response['details']);
    }

    // --- Contoh Tes untuk Register ---

    /**
     * Test case for successful user registration.
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testRegisterSuccess()
    {
        $email = 'newuser@example.com';
        $password = 'SecurePass123!';
        $phone = '081234567890';
        $companyName = 'PT Test Baru';
        $companyNpwp = '112233445566778';
        $companyNib = '112233445566778899';
        $csrfToken = 'test_register_csrf_token';
        $_SESSION['csrf_token'] = $csrfToken;

        $this->mockPhpInput([
            'email' => $email,
            'phone' => $phone,
            'password' => $password,
            'confirm_password' => $password,
            'company_name' => $companyName,
            'company_npwp' => $companyNpwp,
            'company_nib' => $companyNib,
            'company_address' => 'Jl. Dummy No. 123',
            'csrf_token' => $csrfToken
        ]);

        $this->csrfProtectionMock->method('validateToken')->willReturn(true);
        $this->securityManagerMock->method('preventBruteForce')->willReturn(null);
        $this->securityManagerMock->method('sanitizeInput')->will($this->returnArgument(0));
        $this->securityManagerMock->method('hashPassword')->willReturn('hashed_password_mock'); // Mock password hashing

        // Mock Database interactions for registration
        $stmtMock = $this->createMock(\PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);
        $stmtMock->method('fetch')->willReturn(false); // No existing email/phone/npwp/nib
        $stmtMock->method('fetchAll')->willReturn([]); // No existing data for checkRegistrationData
        $this->dbMock->method('getConnection')->willReturnSelf();
        $this->dbMock->method('prepare')->willReturn($stmtMock);
        $this->dbMock->method('beginTransaction')->willReturn(true);
        $this->dbMock->method('commit')->willReturn(true);
        $this->dbMock->method('lastInsertId')->willReturn(1); // Simulate user/company ID

        // Mock OTPManager
        $this->otpManagerMock->method('generateOTP')->willReturn('123456');
        $this->otpManagerMock->method('sendOTP')->willReturn(true);

        // Mock Utils
        $this->getMockBuilder(\App\Utils::class)
             ->onlyMethods(['generateUuidV4']) // Only mock generateUuidV4 if it's used directly
             ->getMock();

        // Expect logUserAction for successful registration
        $this->errorLoggerMock->expects($this->once())
                               ->method('logMethodCalled')
                               ->with('user_actions', 'INFO', $this->stringContains('User registered'), $this->callback(function($context) use ($email) {
                                    return $context['action_details']['email'] === $email;
                               }));


        // Expect ApiResponse::success
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('ApiResponse::success called');

        $authController = new Auth($this->dbMock);
        $authController->handleRequest('register');

        $response = ApiResponse::$lastResponse;
        $this->assertEquals('success', $response['status']);
        $this->assertStringContainsString('Pendaftaran berhasil', $response['message']);
        $this->assertArrayHasKey('user_id', $response['data']);
        $this->assertArrayHasKey('company_id', $response['data']);
    }

    /**
     * Test case for registration with existing email.
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testRegisterExistingEmail()
    {
        $email = 'existing@example.com'; // Assume this email already exists in DB
        $password = 'SecurePass123!';
        $csrfToken = 'test_register_csrf_token';
        $_SESSION['csrf_token'] = $csrfToken;

        $this->mockPhpInput([
            'email' => $email,
            'phone' => '081234567890',
            'password' => $password,
            'confirm_password' => $password,
            'company_name' => 'PT Test Baru',
            'company_npwp' => '112233445566778',
            'company_nib' => '112233445566778899',
            'company_address' => 'Jl. Dummy No. 123',
            'csrf_token' => $csrfToken
        ]);

        $this->csrfProtectionMock->method('validateToken')->willReturn(true);
        $this->securityManagerMock->method('preventBruteForce')->willReturn(null);
        $this->securityManagerMock->method('sanitizeInput')->will($this->returnArgument(0));

        // Mock database to return existing email
        $stmtMock = $this->createMock(\PDOStatement::class);
        $stmtMock->method('execute')->willReturn(true);
        $stmtMock->method('fetch')->willReturn(
            ['email' => $email, 'npwp' => null, 'nib' => null] // Simulate email exists
        );
        $this->dbMock->method('getConnection')->willReturnSelf();
        $this->dbMock->method('prepare')->willReturn($stmtMock);

        // Expect ApiResponse::validation error
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('ApiResponse::error called with status 422');

        $authController = new Auth($this->dbMock);
        $authController->handleRequest('register');

        $response = ApiResponse::$lastResponse;
        $this->assertEquals('error', $response['status']);
        $this->assertEquals('Email ini sudah terdaftar. Silakan gunakan email lain.', $response['message']);
        $this->assertEquals('VALIDATION_ERROR', $response['code']);
        $this->assertEquals(['field' => 'email'], $response['details']);
    }

    // --- Tambahkan lebih banyak tes unit untuk setiap metode di Auth.php: ---
    // testVerifyOtpSuccess
    // testVerifyOtpInvalid
    // testVerifyOtpExpired
    // testResendOtpSuccess
    // testResendOtpCooldown
    // testLogoutSuccess
    // testRefreshTokenSuccess
    // testRefreshTokenInvalid
    // testCheckRegistrationDataFound
    // testCheckRegistrationDataNotFound
}