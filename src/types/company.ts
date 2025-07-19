// File: src/types/company.ts

export interface Company {
  id: string;
  user_id: string;
  company_name: string;
  business_entity_type: string;
  npwp: string;
  nib: string;
  address: string;
  city: string;
  postal_code: string;
  province: string;
  regency_city: string;
  district: string;
  village: string;
  company_phone: string;
  company_email: string;
  business_type: string; 
  investment_value: string;
  employee_count: string;
  leader_name: string;
  leader_position: string;
  leader_nik: string;
  leader_npwp: string;
  kta_kadin_number: string;
  kta_date: string;
  status: 'pending' | 'verified' | 'rejected';
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyFormData {
  companyName: string;
  npwp: string;
  nib: string;
  businessType: string;
  address: string;
  city: string;
  postalCode: string;
  companyPhone: string;
  companyEmail: string;
  investmentCapital: string;
  employeeCount: string;
}

export interface Document {
  id: string;
  user_id: string;
  document_type: string;
  category: 'initial_registration' | 'sbu_application' | 'certificate';
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface DocumentUploadState {
  [key: string]: {
    file: File | null;
    uploaded: boolean;
    uploading: boolean;
    backendId: string | null;
    error: string | null;
  };
}