// src/utils/errorHandler.ts
interface ErrorDetails {
  field?: string;
  code?: string;
  technical?: string;
}

interface ApiError {
  message?: string; // Buat opsional karena mungkin saja tidak ada pesan utama jika hanya ada 'details'
  details?: ErrorDetails | Record<string, string>;
  errors?: Record<string, string>; 
  status?: number;
}

export class ErrorHandler {
  static getReadableErrorMessage(error: any): string {
    let rawMessageText: string = '';
    let validationMessages: string[] = [];

    // 1. Ekstrak pesan teks utama dan potensi pesan validasi dari 'details'/'errors'
    if (error instanceof Error) {
      rawMessageText = error.message;
    } else if (typeof error === 'object' && error !== null) {
      const apiError = error as ApiError;
      if (typeof apiError.message === 'string' && apiError.message.length > 0) {
        rawMessageText = apiError.message;
      }

      // Kumpulkan pesan dari 'details' atau 'errors' jika ada
      if (apiError.details && typeof apiError.details === 'object') {
        Object.values(apiError.details).forEach(val => {
          if (typeof val === 'string' && val.length > 0) {
            validationMessages.push(val);
          }
        });
      }
      if (apiError.errors && typeof apiError.errors === 'object') {
        Object.values(apiError.errors).forEach(val => {
          if (typeof val === 'string' && val.length > 0) {
            validationMessages.push(val);
          }
        });
      }
    }

    const messageLower = rawMessageText.toLowerCase();

    // 2. Prioritaskan pesan validasi spesifik (jika ada dari 'details'/'errors')
    if (validationMessages.length > 0) {
        const combinedValidation = Array.from(new Set(validationMessages))
                                        .filter(Boolean)
                                        .join('. ');
        // Jika pesan utama dari backend adalah generik (Data tidak valid), ganti dengan validasi detail
        if (messageLower.includes('data tidak valid') || messageLower.includes('validation failed') || messageLower.includes('validasi gagal')) {
            return `Mohon periksa kembali input Anda: ${combinedValidation}.`;
        } else if (rawMessageText.length > 0) {
            // Jika ada pesan utama yang berbeda, gabungkan
            return `${rawMessageText}. Detail: ${combinedValidation}.`;
        } else {
            // Hanya ada pesan validasi tanpa pesan utama API
            return `Ada masalah dengan input Anda: ${combinedValidation}.`;
        }
    }

    // 3. Tangani pesan duplikasi spesifik yang mungkin datang langsung sebagai `message`
    if (messageLower.includes('email sudah terdaftar')) {
        return 'Email yang Anda masukkan sudah terdaftar. Silakan gunakan email lain atau masuk jika Anda sudah memiliki akun.';
    }
    if (messageLower.includes('nomor telepon sudah terdaftar')) {
        return 'Nomor telepon yang Anda masukkan sudah terdaftar. Silakan gunakan nomor lain.';
    }
    if (messageLower.includes('npwp sudah terdaftar')) {
        return 'NPWP yang Anda masukkan sudah terdaftar. Silakan periksa kembali atau hubungi administrator.';
    }
    if (messageLower.includes('nib sudah terdaftar')) {
        return 'NIB yang Anda masukkan sudah terdaftar. Silakan periksa kembali atau hubungi administrator.';
    }

    // 4. Tangani pesan error jaringan/timeout
    if (messageLower.includes('fetch') || messageLower.includes('network') || messageLower.includes('failed to fetch')) {
        return 'Koneksi internet bermasalah. Mohon periksa koneksi Anda atau coba lagi nanti.';
    }
    if (messageLower.includes('timeout')) {
        return 'Permintaan terlalu lama. Mohon coba lagi.';
    }

    // 5. Tangani pesan keamanan/autentikasi spesifik
    if (messageLower.includes('csrf') || messageLower.includes('token keamanan')) {
        return 'Sesi Anda telah berakhir atau token keamanan tidak valid. Mohon refresh halaman dan coba lagi.';
    }
    if (messageLower.includes('kredensial') || messageLower.includes('autentikasi') || messageLower.includes('login gagal')) {
        return 'Email atau kata sandi tidak sesuai. Mohon periksa kembali input Anda.';
    }

    // 6. Tangani pesan OTP spesifik
    if (messageLower.includes('otp') && (messageLower.includes('tidak valid') || messageLower.includes('kadaluarsa'))) {
        return 'Kode OTP tidak valid atau sudah kadaluarsa. Mohon periksa kembali atau minta kirim ulang.';
    }
    if (messageLower.includes('otp') && messageLower.includes('terlalu banyak')) {
        return 'Terlalu banyak percobaan OTP. Mohon tunggu beberapa saat sebelum mencoba lagi.';
    }

    // 7. Tangani pesan upload file
    if (messageLower.includes('ukuran file') || messageLower.includes('format file')) {
        return `Gagal mengunggah file. ${rawMessageText}`;
    }

    // 8. Tangani pesan error sistem/database
    if (messageLower.includes('database') || messageLower.includes('server') || messageLower.includes('internal server error') || messageLower.includes('terjadi kesalahan tidak dikenal')) {
        return 'Terjadi gangguan sistem. Tim kami sedang memperbaikinya. Mohon coba lagi nanti.';
    }
    
    // 9. Default: Kembalikan pesan mentah jika ada, atau pesan fallback
    if (rawMessageText.length > 0) {
      return rawMessageText; 
    }

    // Fallback terakhir jika tidak ada pesan yang bisa diekstraksi
    return 'Terjadi kesalahan yang tidak terduga. Mohon coba lagi atau hubungi administrator.';
  }

  // --- Metode lain tetap sama seperti sebelumnya (getErrorSeverity, getErrorContext, shouldRetry, getErrorActions, getErrorTitle, logError) ---
  static getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    if (typeof error === 'string') {
      return 'medium';
    }

    const message = (error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : '')).toLowerCase();
    
    // Critical errors: System-wide failures, data integrity issues
    if (message.includes('database') || message.includes('system error') || message.includes('internal server error')) {
      return 'critical';
    }
    
    // High severity: Security, unrecoverable user sessions, major data loss risk
    if (message.includes('authentication') || message.includes('security') || message.includes('csrf') || message.includes('token tidak valid') || message.includes('kadaluarsa')) {
      return 'high';
    }
    
    // Medium severity: Validation failures, common operational errors, user input issues
    if (message.includes('validation') || message.includes('format tidak valid') || message.includes('kredensial') || message.includes('email sudah terdaftar') || message.includes('file terlalu besar') || message.includes('npwp sudah terdaftar') || message.includes('nib sudah terdaftar') || message.includes('nomor telepon sudah terdaftar')) { // Tambah nomor telepon
      return 'medium';
    }
    
    // Low severity: Minor issues, warnings, non-critical information
    return 'low';
  }

  static getErrorContext(error: any): string {
    if (typeof error === 'string') {
      return 'unknown';
    }

    const message = (error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : '')).toLowerCase();
    
    if (message.includes('register') || message.includes('pendaftaran') || message.includes('akun sudah ada')) {
      return 'registration';
    }
    
    if (message.includes('login') || message.includes('masuk') || message.includes('kredensial')) {
      return 'authentication';
    }
    
    if (message.includes('otp') || message.includes('verifikasi')) {
      return 'otp_verification';
    }
    
    if (message.includes('upload') || message.includes('file') || message.includes('dokumen')) {
      return 'file_upload';
    }
    
    if (message.includes('profile') || message.includes('profil')) {
      return 'profile_update';
    }

    if (message.includes('password')) {
      return 'password_change';
    }

    if (message.includes('permohonan') || message.includes('aplikasi')) {
      return 'application_management';
    }

    if (message.includes('sertifikat')) {
      return 'certificate_management';
    }

    if (message.includes('transaksi')) {
      return 'transaction_management';
    }
    
    return 'general_operation';
  }

  static shouldRetry(error: any): boolean {
    if (typeof error === 'string') {
      return false;
    }

    const message = (error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : '')).toLowerCase();
    
    // Allow retry for transient network issues or server timeouts
    if (message.includes('network') || message.includes('timeout') || message.includes('gagal fetch')) {
      return true;
    }
    
    // Allow retry for generic server errors that are not due to invalid input
    if (message.includes('server') && !message.includes('validation') && !message.includes('kredensial') && !message.includes('terdaftar')) {
      return true;
    }
    
    // Don't retry for validation errors, invalid credentials, or existing accounts
    if (message.includes('validasi') || message.includes('tidak valid') || message.includes('kredensial salah') || message.includes('sudah terdaftar') || message.includes('otp tidak valid') || message.includes('npwp sudah terdaftar') || message.includes('nib sudah terdaftar') || message.includes('nomor telepon sudah terdaftar')) { // Tambah nomor telepon
      return false;
    }
    
    return false;
  }

  static getErrorActions(error: any): Array<{ label: string; action: string }> {
    const context = this.getErrorContext(error);
    const actions = [];
    const message = (error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : '')).toLowerCase();

    switch (context) {
      case 'authentication':
        if (message.includes('kredensial')) {
          actions.push({ label: 'Coba Lagi', action: 'retry_login' });
        }
        actions.push({ label: 'Lupa Kata Sandi?', action: 'forgot_password' });
        actions.push({ label: 'Daftar Akun Baru', action: 'go_to_register' });
        break;
        
      case 'registration':
        if (message.includes('sudah terdaftar') || message.includes('npwp sudah terdaftar') || message.includes('nib sudah terdaftar') || message.includes('email sudah terdaftar') || message.includes('nomor telepon sudah terdaftar')) { // Tambah email & nomor telepon
          actions.push({ label: 'Masuk di Sini', action: 'go_to_login' });
        } else {
          actions.push({ label: 'Perbaiki Data', action: 'fix_data' });
        }
        break;
        
      case 'otp_verification':
        if (message.includes('tidak valid') || message.includes('kadaluarsa')) {
          actions.push({ label: 'Minta Kode Baru', action: 'resend_otp' });
        } else if (message.includes('terlalu banyak')) {
          actions.push({ label: 'Tunggu Sebentar', action: 'wait_and_retry' });
        }
        actions.push({ label: 'Periksa Kotak Masuk Email', action: 'check_email' });
        break;

      case 'file_upload':
        actions.push({ label: 'Coba Unggah Ulang', action: 'retry_upload' });
        actions.push({ label: 'Periksa Persyaratan File', action: 'check_file_requirements' });
        break;
        
      case 'profile_update':
      case 'password_change':
        actions.push({ label: 'Coba Simpan Kembali', action: 'retry_save' });
        break;

      case 'general_operation':
      case 'application_management':
      case 'certificate_management':
      case 'transaction_management':
      default:
        if (this.shouldRetry(error)) {
          actions.push({ label: 'Coba Lagi', action: 'retry' });
        }
        actions.push({ label: 'Hubungi Bantuan', action: 'contact_support' });
    }

    return actions;
  }

  // Helper function for getting toast titles based on severity
  static getErrorTitle(severity: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (severity) {
      case 'critical':
        return 'Kesalahan Sistem';
      case 'high':
        return 'Kesalahan Keamanan';
      case 'medium':
        return 'Kesalahan Input'; 
      case 'low':
        return 'Peringatan';
      default:
        return 'Kesalahan';
    }
  }

  static logError(error: any, context: string, additionalData?: any) {
    const errorData = {
      timestamp: new Date().toISOString(),
      message: this.getReadableErrorMessage(error),
      severity: this.getErrorSeverity(error),
      context: context,
      originalError: error, 
      additionalData: additionalData,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Ini akan dicatat oleh backend/api/logs/frontend-error.php jika terintegrasi
    // console.error('Error logged:', errorData); // Dihapus untuk production
  }
}

export default ErrorHandler;
