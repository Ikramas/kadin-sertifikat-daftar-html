// gemnini/src/types/error.ts

// Interface untuk error dari API backend
export interface BackendErrorResponse {
  success: false;
  code: string; // Kode error internal (misal: "VALIDATION_ERROR", "DUPLICATE_EMAIL", "INTERNAL_SERVER_ERROR")
  message: string; // Pesan umum atau pesan fallback
  errors?: Record<string, string>; // Detail error validasi per field
  detail?: string; // Detail teknis tambahan atau ID log
  status?: number; // Kode status HTTP (bisa juga diambil dari objek response Axios)
}

// Custom Error Class untuk error yang berasal dari API
export class ApiError extends Error {
  public code: string;
  public errors?: Record<string, string>;
  public status?: number;
  public originalError: any; // Untuk menyimpan objek error asli (misal dari Axios)

  constructor(backendResponse: BackendErrorResponse, originalError: any, status?: number) {
    super(backendResponse.message || "Terjadi kesalahan yang tidak diketahui dari server.");
    this.name = 'ApiError';
    this.code = backendResponse.code;
    this.errors = backendResponse.errors;
    this.status = status; // Ambil status HTTP dari respons jika tersedia
    this.originalError = originalError; // Simpan error asli untuk debugging
    Object.setPrototypeOf(this, ApiError.prototype); // Penting untuk inheritance di TypeScript
  }
}

// Custom Error Class untuk error jaringan
export class NetworkError extends Error {
  constructor(message: string = "Tidak dapat terhubung ke server. Mohon periksa koneksi internet Anda.") {
    super(message);
    this.name = 'NetworkError';
    this.code = 'NETWORK_ERROR';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

// Custom Error Class untuk error tak terduga (misal, di sisi klien)
export class UnexpectedError extends Error {
  constructor(message: string = "Terjadi kesalahan tidak terduga.") {
    super(message);
    this.name = 'UnexpectedError';
    this.code = 'UNEXPECTED_ERROR';
    Object.setPrototypeOf(this, UnexpectedError.prototype);
  }
}