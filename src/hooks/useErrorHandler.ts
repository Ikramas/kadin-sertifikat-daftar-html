// src/hooks/useErrorHandler.ts
// Custom hook ini menyediakan fungsionalitas penanganan error yang terpusat
// dan integrasi dengan sistem notifikasi toast, serta utilitas logging.

import { useCallback } from 'react'; // Import useCallback
import { useToast } from '@/components/ui/use-toast'; 
import { ErrorHandler } from '@/utils/errorHandler'; 

/**
 * Custom hook untuk manajemen error, validasi, sukses, dan peringatan di sisi klien.
 * Ini mengintegrasikan logging, pemrosesan pesan, dan notifikasi UI (toast).
 */
export const useErrorHandler = () => {
  // Mengakses fungsi `toast` dari hook `useToast` Anda
  const { toast } = useToast();

  /**
   * Menangani error umum yang terjadi di aplikasi.
   * Ini akan mencatat error, mendapatkan pesan yang mudah dibaca, menentukan tingkat keparahan,
   * dan menampilkan notifikasi toast yang sesuai.
   * @param {any} error Objek error yang dilemparkan (bisa berupa Error, respons API, dll.).
   * @param {string} context Konteks di mana error terjadi (misal: 'API call', 'form submission'). Default 'general'.
   * @param {any} [additionalData] Data tambahan opsional yang relevan dengan error untuk tujuan logging.
   * @returns {object} Objek berisi informasi error yang diproses.
   */
  const handleError = useCallback((error: any, context: string = 'general', additionalData?: any) => {
    // Log error menggunakan utilitas ErrorHandler statis Anda
    ErrorHandler.logError(error, context, additionalData);
    
    // Dapatkan pesan error yang mudah dibaca dari utilitas ErrorHandler
    const message = ErrorHandler.getReadableErrorMessage(error);
    // Dapatkan tingkat keparahan error
    const severity = ErrorHandler.getErrorSeverity(error);
    // Dapatkan aksi terkait error
    const actions = ErrorHandler.getErrorActions(error);
    
    // Tentukan variant toast berdasarkan severity
    let toastVariant: 'default' | 'destructive' | 'success' | 'info' | 'warning';
    if (severity === 'critical' || severity === 'high') {
      toastVariant = 'destructive';
    } else if (severity === 'medium') { // Untuk kesalahan menengah, tampilkan sebagai warning
      toastVariant = 'warning'; 
    } else { // Untuk kesalahan rendah
      toastVariant = 'default';
    }

    // Tampilkan notifikasi toast
    toast({
      title: ErrorHandler.getErrorTitle(severity), 
      description: message,                       
      variant: toastVariant, 
      duration: 7000, 
    });

    // Mengembalikan informasi error yang diproses untuk penanganan lebih lanjut di komponen pemanggil
    return {
      message,
      severity,
      actions,
      shouldRetry: ErrorHandler.shouldRetry(error), 
      context: ErrorHandler.getErrorContext(error) 
    };
  }, [toast]); // Dependensi useCallback: `toast` dari `useToast`

  /**
   * Menangani error validasi spesifik, biasanya dari respons API yang menunjukkan
   * masalah input data.
   * @param {Record<string, string>} errors Objek berisi key-value pasangan field-error (misal: { email: 'Email tidak valid' }).
   * @param {string} context Konteks di mana validasi gagal. Default 'validation'.
   * @returns {object} Objek berisi informasi error validasi yang diproses.
   */
  const handleValidationErrors = useCallback((errors: Record<string, string>, context: string = 'validation') => {
    ErrorHandler.logError({ message: 'Validation failed', details: errors }, context);
    
    const errorMessage = Object.values(errors).filter(Boolean).join('. ') + '.';
    const displayMessage = errorMessage.length > 0 
                           ? `Mohon periksa kembali input Anda: ${errorMessage}` 
                           : 'Ada beberapa input yang tidak valid. Mohon periksa kembali formulir Anda.';

    toast({
      title: 'Data Tidak Valid',                  
      description: displayMessage, 
      variant: 'destructive',                      
      duration: 8000, 
    });

    return {
      message: displayMessage,
      severity: 'medium' as const, 
      errors,
      context: 'validation'
    };
  }, [toast]); // Dependensi useCallback: `toast`

  /**
   * Menampilkan notifikasi toast untuk operasi yang berhasil.
   * @param {string} message Pesan sukses yang akan ditampilkan.
   * @param {string} [title] Judul toast. Default 'Berhasil'.
   * @param {any} [toastOptions] Opsi tambahan untuk toast (misalnya duration, action).
   */
  const handleSuccess = useCallback((message: string, title: string = 'Berhasil', toastOptions?: any) => {
    toast({
      title,
      description: message,
      variant: 'success', 
      duration: 4000, 
      ...toastOptions,
    });
  }, [toast]); // Dependensi useCallback: `toast`

  /**
   * Menampilkan notifikasi toast untuk peringatan.
   * @param {string} message Pesan peringatan yang akan ditampilkan.
   * @param {string} [title] Judul toast. Default 'Perhatian'.
   * @param {any} [toastOptions] Opsi tambahan untuk toast (misalnya duration, action).
   */
  const handleWarning = useCallback((message: string, title: string = 'Perhatian', toastOptions?: any) => {
    toast({
      title,
      description: message,
      variant: 'warning', 
      duration: 6000, 
      ...toastOptions,
    });
  }, [toast]); // Dependensi useCallback: `toast`

  // Mengembalikan semua fungsi handler agar dapat digunakan oleh komponen yang memanggil hook ini.
  return {
    handleError,
    handleValidationErrors,
    handleSuccess,
    handleWarning
  };
};