
import { z } from 'zod';

export const companyInfoSchema = z.object({
  companyName: z.string().min(3, 'Nama perusahaan minimal 3 karakter').max(100, 'Nama perusahaan maksimal 100 karakter'),
  companyType: z.string().min(1, 'Jenis perusahaan harus dipilih'),
  establishedYear: z.number().min(1900, 'Tahun minimal 1900').max(new Date().getFullYear(), 'Tahun tidak boleh lebih dari tahun ini'),
  employeeCount: z.string().min(1, 'Jumlah karyawan harus dipilih'),
  address: z.string().min(10, 'Alamat minimal 10 karakter').max(500, 'Alamat maksimal 500 karakter'),
  phone: z.string().regex(/^[0-9+\-\s()]{10,15}$/, 'Format nomor telepon tidak valid'),
  email: z.string().email('Format email tidak valid'),
  website: z.string().url('Format website tidak valid').optional().or(z.literal('')),
});

export const directorInfoSchema = z.object({
  directorName: z.string().min(3, 'Nama direktur minimal 3 karakter').max(100, 'Nama direktur maksimal 100 karakter'),
  directorPosition: z.string().min(1, 'Jabatan harus dipilih'),
  directorKtp: z.string().regex(/^[0-9]{16}$/, 'KTP harus 16 digit angka'),
  directorBirth: z.string().min(1, 'Tanggal lahir harus diisi'),
  directorPhone: z.string().regex(/^[0-9+\-\s()]{10,15}$/, 'Format nomor telepon tidak valid'),
  directorEmail: z.string().email('Format email tidak valid'),
});

export const documentUploadSchema = z.object({
  aktaPendirian: z.any().optional().refine((files) => {
    return files === undefined || files?.length > 0;
  }, 'Akta pendirian wajib diupload'),
  npwpDoc: z.any().optional().refine((files) => {
    return files === undefined || files?.length > 0;
  }, 'NPWP wajib diupload'),
  nibDoc: z.any().optional().refine((files) => {
    return files === undefined || files?.length > 0;
  }, 'NIB wajib diupload'),
  ktpDirector: z.any().optional().refine((files) => {
    return files === undefined || files?.length > 0;
  }, 'KTP Direktur wajib diupload'),
  domisiliDoc: z.any().optional().refine((files) => {
    return files === undefined || files?.length > 0;
  }, 'Surat domisili wajib diupload'),
  financialReport: z.any().optional(),
});

export const submitSchema = z.object({
  terms: z.boolean().refine((val) => val === true, 'Anda harus menyetujui pernyataan kebenaran data'),
  privacy: z.boolean().refine((val) => val === true, 'Anda harus menyetujui kebijakan privasi'),
  contact: z.boolean().refine((val) => val === true, 'Anda harus memberikan izin komunikasi'),
});

export type CompanyInfoData = z.infer<typeof companyInfoSchema>;
export type DirectorInfoData = z.infer<typeof directorInfoSchema>;
export type DocumentUploadData = z.infer<typeof documentUploadSchema>;
export type SubmitData = z.infer<typeof submitSchema>;

export type VerificationStatus = 'draft' | 'submitted' | 'under_review' | 'revision_needed' | 'approved' | 'rejected';

export interface ApplicationStatus {
  status: VerificationStatus;
  submittedAt?: Date;
  reviewedAt?: Date;
  comments?: string;
  canEdit: boolean;
}
