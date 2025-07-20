// File: src/types/user.ts

import type { Company, Document } from './company'; // Import Document type

// Mendefinisikan ulang DocumentData di sini atau pastikan sudah ada di file lain dan diimpor.
// Jika DocumentData digunakan di banyak tempat, lebih baik definisikan di file terpisah (misal types/documents.ts)
// dan impor ke sini. Untuk sementara, kita definisikan di sini agar kode berfungsi.
// Perbaikan: Ganti dengan import Document dari company.ts
// interface DocumentData {
//   id: string;
//   original_name: string;
//   file_name: string;
//   document_type: string;
//   status: string;
//   file_url?: string;
// }

export interface User {
  id: string;
  uuid: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending_verification' | 'pending_document_verification' | 'pending_admin_approval' | 'active' | 'verified' | 'suspended';
  role: 'user' | 'admin';
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  documents?: Document[]; // Perbaikan di sini: Gunakan tipe Document yang sudah diimport
}

export interface UserRegistrationData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  
  companyName: string;
  npwp: string;
  nib: string;
  businessType: string;
  address: string;
  city: string;
  postalCode: string;
  companyPhone: string;
  companyEmail: string;
  investmentValue: string;
  employeeCount: string;
  
  termsAccepted: boolean;
}

export interface AuthState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isDocumentVerified: boolean;
  isLoading: boolean;
}