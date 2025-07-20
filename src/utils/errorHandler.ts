interface ErrorDetails {
  field?: string;
  code?: string;
  technical?: string;
}

interface ApiError {
  message: string;
  details?: ErrorDetails | Record<string, string>;
  status?: number;
}

export class ErrorHandler {
  static getReadableErrorMessage(error: any): string {
    // Handle different types of errors
    if (typeof error === 'string') {
      return error;
    }

    if (error.message) {
      // Check for common error patterns and provide friendly messages
      const message = error.message.toLowerCase();
      
      // Network errors
      if (message.includes('fetch') || message.includes('network')) {
        return 'Koneksi internet bermasalah. Silakan periksa koneksi Anda dan coba lagi.';
      }
      
      // CSRF token errors
      if (message.includes('csrf') || message.includes('token keamanan')) {
        return 'Sesi keamanan telah habis. Silakan refresh halaman dan coba lagi.';
      }
      
      // Validation errors
      if (message.includes('wajib diisi')) {
        return error.message;
      }
      
      if (message.includes('format') && message.includes('tidak valid')) {
        return error.message;
      }
      
      // Database errors (hide technical details from user)
      if (message.includes('database') || message.includes('connection')) {
        return 'Terjadi gangguan sistem. Tim kami sedang memperbaikinya. Silakan coba lagi nanti.';
      }
      
      // OTP errors
      if (message.includes('otp')) {
        return error.message;
      }
      
      // Registration errors
      if (message.includes('sudah terdaftar') || message.includes('sudah ada')) {
        return error.message;
      }
      
      // Rate limiting
      if (message.includes('terlalu banyak') || message.includes('tunggu')) {
        return error.message;
      }
      
      return error.message;
    }

    return 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi administrator.';
  }

  static getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    if (typeof error === 'string') {
      return 'medium';
    }

    const message = error.message?.toLowerCase() || '';
    
    // Critical errors
    if (message.includes('database') || message.includes('system') || message.includes('server')) {
      return 'critical';
    }
    
    // High severity
    if (message.includes('authentication') || message.includes('security') || message.includes('csrf')) {
      return 'high';
    }
    
    // Medium severity
    if (message.includes('validation') || message.includes('format')) {
      return 'medium';
    }
    
    // Low severity
    return 'low';
  }

  static getErrorContext(error: any): string {
    if (typeof error === 'string') {
      return 'unknown';
    }

    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('register') || message.includes('pendaftaran')) {
      return 'registration';
    }
    
    if (message.includes('login') || message.includes('masuk')) {
      return 'authentication';
    }
    
    if (message.includes('otp') || message.includes('verifikasi')) {
      return 'verification';
    }
    
    if (message.includes('upload') || message.includes('file')) {
      return 'file_upload';
    }
    
    if (message.includes('profile') || message.includes('profil')) {
      return 'profile';
    }
    
    return 'general';
  }

  static shouldRetry(error: any): boolean {
    if (typeof error === 'string') {
      return false;
    }

    const message = error.message?.toLowerCase() || '';
    
    // Allow retry for network issues
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return true;
    }
    
    // Allow retry for temporary server issues
    if (message.includes('server') && !message.includes('validation')) {
      return true;
    }
    
    // Don't retry for validation or authentication errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('sudah ada')) {
      return false;
    }
    
    return false;
  }

  static getErrorActions(error: any): Array<{ label: string; action: string }> {
    const context = this.getErrorContext(error);
    const actions = [];

    switch (context) {
      case 'authentication':
        actions.push({ label: 'Coba Login Lagi', action: 'retry_login' });
        actions.push({ label: 'Lupa Password', action: 'forgot_password' });
        break;
        
      case 'registration':
        actions.push({ label: 'Perbaiki Data', action: 'fix_data' });
        actions.push({ label: 'Sudah Punya Akun?', action: 'go_to_login' });
        break;
        
      case 'verification':
        actions.push({ label: 'Kirim Ulang OTP', action: 'resend_otp' });
        actions.push({ label: 'Periksa Email', action: 'check_email' });
        break;
        
      default:
        if (this.shouldRetry(error)) {
          actions.push({ label: 'Coba Lagi', action: 'retry' });
        }
        actions.push({ label: 'Hubungi Support', action: 'contact_support' });
    }

    return actions;
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
      url: window.location.href
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorData);
    }

    // In production, you might want to send this to an external logging service
    // Example: sendToLoggingService(errorData);
  }
}

export default ErrorHandler;