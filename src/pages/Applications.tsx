// src/pages/Applications.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  FileCheck, // Import for Submit button icon
  Info, // FIX: Menambahkan ikon Info untuk dialog
  Send // FIX: Menambahkan ikon Send untuk dialog
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { DocumentUploader } from '@/components/documents/DocumentUploader';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useErrorHandler } from '@/hooks/useErrorHandler';

// Import komponen AlertDialog untuk pop-up konfirmasi
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Application {
  id: string;
  application_number: string;
  code_reg: string; 
  application_type: 'new' | 'renewal' | 'upgrade';
  current_sbu_number?: string;
  requested_classification: string;
  business_field: string;
  company_qualification: 'Kecil' | 'Menengah' | 'Besar';

  akta_pendirian_notaris?: string;
  akta_pendirian_nomor?: string;
  akta_pendirian_tanggal?: string;
  akta_pendirian_tanggal_formatted?: string;
  akta_perubahan_notaris?: string;
  akta_perubahan_nomor?: string;
  akta_perubahan_tanggal?: string;
  akta_perubahan_tanggal_formatted?: string;
  sk_kemenkumham_nomor_tanggal?: string;
  nib_date?: string;
  nib_date_formatted?: string;
  sub_bidang_code?: string;
  bidang_name?: string;

  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
  submission_date?: string;
  review_date?: string;
  completion_date?: string;
  notes?: string;
  company_name: string;
  reviewer_name?: string;
  document_count: number;
  created_at_formatted: string;
  submission_date_formatted?: string;
  review_date_formatted?: string;
  completion_date_formatted?: string;
}

interface ApplicationsResponse {
  applications: Application[];
  total: number;
}

// Skema Validasi untuk NewApplicationForm
const newApplicationSchema = z.object({
  applicationType: z.enum(['new', 'renewal', 'upgrade'], { message: 'Jenis permohonan wajib dipilih' }),
  mainClassificationInput: z.string().min(1, 'Klasifikasi utama wajib diisi'), // Renamed for clarity
  bidangName: z.string().min(1, 'Nama bidang usaha wajib diisi'), // Will map to `business_field` and `bidang_name` in DB
  subBidangCode: z.string().min(1, 'Kode Subbidang wajib diisi'),
  companyQualification: z.enum(['Kecil', 'Menengah', 'Besar'], { message: 'Kualifikasi perusahaan wajib dipilih' }),
  currentSbuNumber: z.string().optional(),
  notes: z.string().optional(),

  aktaPendirianNotaris: z.string().min(1, 'Nama Notaris Akta Pendirian wajib diisi'),
  aktaPendirianNomor: z.string().min(1, 'Nomor Akta Pendirian wajib diisi'),
  aktaPendirianTanggal: z.string().min(1, 'Tanggal Pendirian wajib diisi').refine((val) => !isNaN(new Date(val).getTime()), { message: "Format tanggal tidak valid (YYYY-MM-DD)" }),

  aktaPerubahanNotaris: z.string().optional(),
  aktaPerubahanNomor: z.string().optional(),
  aktaPerubahanTanggal: z.string().optional().refine((val) => !val || !isNaN(new Date(val).getTime()), { message: "Format tanggal tidak valid (YYYY-MM-DD)" }),

  skKemenkumhamNomorTanggal: z.string().min(1, 'Nomor/Tanggal SK Kemenkumham wajib diisi'),
  nibDate: z.string().min(1, 'Tanggal NIB wajib diisi').refine((val) => !isNaN(new Date(val).getTime()), { message: "Format tanggal tidak valid (YYYY-MM-DD)" }),
});

type NewApplicationFormInputs = z.infer<typeof newApplicationSchema>;

const NewApplicationForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, company } = useAuth();
  const { handleError, handleSuccess, handleValidationErrors } = useErrorHandler();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
    trigger,
  } = useForm<NewApplicationFormInputs>({
    resolver: zodResolver(newApplicationSchema),
    mode: 'onChange',
    defaultValues: {
      applicationType: 'new',
      mainClassificationInput: '',
      bidangName: '',
      subBidangCode: '',
      companyQualification: 'Kecil',
      currentSbuNumber: '',
      notes: '',
      aktaPendirianTanggal: '',
      aktaPerubahanTanggal: '',
      skKemenkumhamNomorTanggal: '',
      nibDate: '',
    }
  });

  const applicationType = watch('applicationType');

  const {
    initializeDocument,
    uploadDocument,
    removeDocument,
    getDocumentState,
    getAllUploadedDocuments,
  } = useDocumentUpload();

  useEffect(() => {
    initializeDocument('neraca_tahun_terakhir');
    initializeDocument('surat_permohonan_subbidang');
  }, [initializeDocument]);


  const onSubmit = async (data: NewApplicationFormInputs) => {
    // Trigger manual validation for all fields before proceeding
    const isValid = await trigger();
    if (!isValid) {
      handleValidationErrors(errors as Record<string, string>, 'application_form_validation');
      return;
    }

    const uploadedSbuDocs = getAllUploadedDocuments();
    const neracaUploaded = uploadedSbuDocs.some(doc => doc.documentType === 'neraca_tahun_terakhir' && doc.backendId);
    const suratPermohonanUploaded = uploadedSbuDocs.some(doc => doc.documentType === 'surat_permohonan_subbidang' && doc.backendId);

    if (!neracaUploaded || !suratPermohonanUploaded) {
        handleError(new Error('Mohon unggah File Neraca Tahun Terakhir dan File Surat Permohonan SubBidang.'), 'application_document_check');
        return;
    }

    try {
      if (!user || !company) {
        throw new Error("Data pengguna atau perusahaan tidak lengkap. Mohon login ulang.");
      }

      const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
      const csrfData = await csrfResponse.json();
      if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
          throw new Error(csrfData.message || 'Gagal mendapatkan token keamanan. Mohon refresh halaman.');
      }
      const csrfToken = csrfData.data.csrf_token;

      const documentIdsForBackend = uploadedSbuDocs.map(doc => doc.backendId);

      const applicationData = {
        ...data,
        requested_classification: data.mainClassificationInput, 
        business_field: data.bidangName, 
        sub_bidang_code: data.subBidangCode,
        bidang_name: data.bidangName, 

        npwp: company.npwp, 
        leader_npwp: company.leader_npwp, 
        nib: company.nib, 

        uploaded_documents_sbu: documentIdsForBackend,

        csrf_token: csrfToken
      };

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      }

      const response = await fetch('/backend/api/applications/create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(applicationData),
      });

      const result = await response.json();

      if (result.status === 'success') {
        handleSuccess(`Permohonan SBU dengan nomor ${result.data.application_number} berhasil dibuat dalam status draft.`, 'Permohonan Dibuat!');
        queryClient.invalidateQueries({ queryKey: ['applications'] }); 
        onClose();
        navigate('/applications');
      } else {
        if (result.details) {
          handleValidationErrors(result.details, 'application_creation');
        } else {
          handleError(new Error(result.message), 'application_creation');
        }
      }

    } catch (error: any) {
      handleError(error, 'application_creation');
    }
  };

  const neracaDocState = getDocumentState('neraca_tahun_terakhir');
  const suratPermohonanDocState = getDocumentState('surat_permohonan_subbidang');


  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle className="text-xl">Ajukan SBU Baru</CardTitle>
        <CardDescription>Isi detail permohonan SBU Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* NPWP Perusahaan - Pre-filled & Disabled */}
        <div>
          <Label htmlFor="companyNpwp">NPWP Perusahaan</Label>
          <Input
            id="companyNpwp"
            value={company?.npwp || ''}
            disabled={true}
            readOnly
            className="bg-gray-100 opacity-80"
          />
        </div>

        {/* NPWP Pimpinan - Pre-filled & Disabled */}
        <div>
          <Label htmlFor="leaderNpwp">NPWP Pimpinan/Direktur</Label>
          <Input
            id="leaderNpwp"
            value={company?.leader_npwp || ''}
            disabled={true}
            readOnly
            className="bg-gray-100 opacity-80"
          />
        </div>

        {/* NIB - Pre-filled & Disabled */}
        <div>
          <Label htmlFor="nib">NIB (Nomor Induk Berusaha)</Label>
          <Input
            id="nib"
            value={company?.nib || ''}
            disabled={true}
            readOnly
            className="bg-gray-100 opacity-80"
          />
        </div>

        {/* Akta Pendirian */}
        <div className="space-y-2 border-t pt-4">
          <CardTitle className="text-md mb-2">1. Akta Pendirian</CardTitle>
          <div>
            <Label htmlFor="aktaPendirianNotaris">Nama Notaris *</Label>
            <Input
              id="aktaPendirianNotaris"
              {...register('aktaPendirianNotaris')}
              className={errors.aktaPendirianNotaris ? 'border-destructive' : ''}
              placeholder="Nama Notaris Akta Pendirian"
            />
            {errors.aktaPendirianNotaris && <p className="text-sm text-destructive">{errors.aktaPendirianNotaris.message}</p>}
          </div>
          <div>
            <Label htmlFor="aktaPendirianNomor">Nomor Akta *</Label>
            <Input
              id="aktaPendirianNomor"
              {...register('aktaPendirianNomor')}
              className={errors.aktaPendirianNomor ? 'border-destructive' : ''}
              placeholder="Nomor Akta Pendirian"
            />
            {errors.aktaPendirianNomor && <p className="text-sm text-destructive">{errors.aktaPendirianNomor.message}</p>}
          </div>
          <div>
            <Label htmlFor="aktaPendirianTanggal">Tanggal Pendirian *</Label>
            <Input
              id="aktaPendirianTanggal"
              type="date"
              {...register('aktaPendirianTanggal')}
              className={errors.aktaPendirianTanggal ? 'border-destructive' : ''}
            />
            {errors.aktaPendirianTanggal && <p className="text-sm text-destructive">{errors.aktaPendirianTanggal.message}</p>}
          </div>
        </div>

        {/* Akta Perubahan Terakhir */}
        <div className="space-y-2 border-t pt-4">
          <CardTitle className="text-md mb-2">2. Akta Perubahan Terakhir (Opsional)</CardTitle>
          <div>
            <Label htmlFor="aktaPerubahanNotaris">Nama Notaris</Label>
            <Input
              id="aktaPerubahanNotaris"
              {...register('aktaPerubahanNotaris')}
              className={errors.aktaPerubahanNotaris ? 'border-destructive' : ''}
              placeholder="Nama Notaris Akta Perubahan"
            />
            {errors.aktaPerubahanNotaris && <p className="text-sm text-destructive">{errors.aktaPerubahanNotaris.message}</p>}
          </div>
          <div>
            <Label htmlFor="aktaPerubahanNomor">Nomor Akta</Label>
            <Input
              id="aktaPerubahanNomor"
              {...register('aktaPerubahanNomor')}
              className={errors.aktaPerubahanNomor ? 'border-destructive' : ''}
              placeholder="Nomor Akta Perubahan"
            />
            {errors.aktaPerubahanNomor && <p className="text-sm text-destructive">{errors.aktaPerubahanNomor.message}</p>}
          </div>
          <div>
            <Label htmlFor="aktaPerubahanTanggal">Tanggal Perubahan</Label>
            <Input
              id="aktaPerubahanTanggal"
              type="date"
              {...register('aktaPerubahanTanggal')}
              className={errors.aktaPerubahanTanggal ? 'border-destructive' : ''}
            />
            {errors.aktaPerubahanTanggal && <p className="text-sm text-destructive">{errors.aktaPerubahanTanggal.message}</p>}
          </div>
        </div>

        {/* Pengesahan Akte Oleh Menteri Kehakiman RI (SK Kemenkumham) */}
        <div className="space-y-2 border-t pt-4">
          <CardTitle className="text-md mb-2">3. Pengesahan Akte Oleh Menteri Kehakiman RI (SK Kemenkumham) *</CardTitle>
          <div>
            <Label htmlFor="skKemenkumhamNomorTanggal">Nomor/Tanggal *</Label>
            <Input
              id="skKemenkumhamNomorTanggal"
              {...register('skKemenkumhamNomorTanggal')}
              className={errors.skKemenkumhamNomorTanggal ? 'border-destructive' : ''}
              placeholder="Contoh: AHU-0038954.AH.01.02.TAHUN 2023/10-07-2023"
            />
            {errors.skKemenkumhamNomorTanggal && <p className="text-sm text-destructive">{errors.skKemenkumhamNomorTanggal.message}</p>}
          </div>
        </div>

        {/* Tanggal NIB */}
        <div className="space-y-2 border-t pt-4">
          <CardTitle className="text-md mb-2">4. Tanggal NIB *</CardTitle>
          <div>
            <Label htmlFor="nibDate">Tanggal NIB *</Label>
            <Input
              id="nibDate"
              type="date"
              {...register('nibDate')}
              className={errors.nibDate ? 'border-destructive' : ''}
            />
            {errors.nibDate && <p className="text-sm text-destructive">{errors.nibDate.message}</p>}
          </div>
        </div>

        {/* Input Kode Subbidang */}
        <div className="space-y-2 border-t pt-4">
          <Label htmlFor="subBidangCode">Kode Subbidang *</Label>
          <Input
            id="subBidangCode"
            {...register('subBidangCode')}
            className={errors.subBidangCode ? 'border-destructive' : ''}
            placeholder="Contoh: AN 2.05.07.07"
          />
          {errors.subBidangCode && <p className="text-sm text-destructive">{errors.subBidangCode.message}</p>}
        </div>

        {/* Input Klasifikasi Utama */}
        <div>
          <Label htmlFor="mainClassificationInput">Klasifikasi Utama *</Label>
          <Input
            id="mainClassificationInput"
            {...register('mainClassificationInput')}
            className={errors.mainClassificationInput ? 'border-destructive' : ''}
            placeholder="Contoh: Konstruksi, Perdagangan, Jasa"
          />
          {errors.mainClassificationInput && <p className="text-sm text-destructive">{errors.mainClassificationInput.message}</p>}
        </div>

        {/* Input Nama Bidang Usaha */}
        <div>
          <Label htmlFor="bidangName">Nama Bidang Usaha *</Label>
          <Input
            id="bidangName"
            {...register('bidangName')}
            className={errors.bidangName ? 'border-destructive' : ''}
            placeholder="Contoh: jasa pemborongan telekomunikasi darat : kontrol & instrumen"
          />
          {errors.bidangName && <p className="text-sm text-destructive">{errors.bidangName.message}</p>}
        </div>

        {/* Input SBU Application fields */}
        <div>
          <Label htmlFor="appType">Jenis Permohonan *</Label>
          <Select
            value={applicationType}
            onValueChange={(val: 'new' | 'renewal' | 'upgrade') => setValue('applicationType', val, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.applicationType ? 'border-destructive' : ''}>
              <SelectValue placeholder="Pilih jenis permohonan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Baru</SelectItem>
              <SelectItem value="renewal">Perpanjangan</SelectItem>
              <SelectItem value="upgrade">Peningkatan</SelectItem>
            </SelectContent>
          </Select>
          {errors.applicationType && <p className="text-sm text-destructive">{errors.applicationType.message}</p>}
        </div>

        <div>
          <Label htmlFor="qualification">Kualifikasi Perusahaan *</Label>
          <Select
            value={watch('companyQualification')}
            onValueChange={(val: 'Kecil' | 'Menengah' | 'Besar') => setValue('companyQualification', val, { shouldValidate: true })}
          >
            <SelectTrigger className={errors.companyQualification ? 'border-destructive' : ''}>
              <SelectValue placeholder="Pilih kualifikasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Kecil">Kecil</SelectItem>
              <SelectItem value="Menengah">Menengah</SelectItem>
              <SelectItem value="Besar">Besar</SelectItem>
            </SelectContent>
          </Select>
          {errors.companyQualification && <p className="text-sm text-destructive">{errors.companyQualification.message}</p>}
        </div>

        {applicationType !== 'new' && (
          <div>
            <Label htmlFor="currentSbuNumber">Nomor SBU Saat Ini (Untuk Perpanjangan/Peningkatan)</Label>
            <Input
              id="currentSbuNumber"
              {...register('currentSbuNumber')}
              className={errors.currentSbuNumber ? 'border-destructive' : ''}
              placeholder="Masukkan nomor SBU Anda saat ini"
            />
            {errors.currentSbuNumber && <p className="text-sm text-destructive">{errors.currentSbuNumber.message}</p>}
          </div>
        )}

        <div>
          <Label htmlFor="notes">Catatan (Opsional)</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            className={errors.notes ? 'border-destructive' : ''}
            placeholder="Tambahkan catatan jika ada"
          />
          {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
        </div>

        {/* File Neraca Tahun Terakhir - Tambah DocumentUploader */}
        <div className="space-y-2 border-t pt-4">
          <DocumentUploader
            documentType="neraca_tahun_terakhir"
            label="7. File Neraca Tahun Terakhir"
            required={true}
            uploaded={neracaDocState.uploaded}
            uploading={neracaDocState.uploading}
            error={neracaDocState.error}
            onFileSelect={(file) => uploadDocument('neraca_tahun_terakhir', file)}
            onRemove={() => removeDocument('neraca_tahun_terakhir')}
            disabled={isSubmitting}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Silakan unduh format neraca di bawah ini, isi, lalu unggah dokumennya.
          </p>
          <a href="/public/templates/format_neraca.pdf" download="format_neraca.pdf" className="text-primary hover:underline flex items-center gap-2">
            <Download className="w-4 h-4" /> Unduh Format Neraca
          </a>
        </div>

        {/* File Surat Permohonan SubBidang - Tambah DocumentUploader */}
        <div className="space-y-2 border-t pt-4">
          <DocumentUploader
            documentType="surat_permohonan_subbidang"
            label="8. File Surat Permohonan SubBidang (Di Cap dan Ditandatangani Pimpinan)"
            required={true}
            uploaded={suratPermohonanDocState.uploaded}
            uploading={suratPermohonanDocState.uploading}
            error={suratPermohonanDocState.error}
            onFileSelect={(file) => uploadDocument('surat_permohonan_subbidang', file)}
            onRemove={() => removeDocument('surat_permohonan_subbidang')}
            disabled={isSubmitting}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Silakan unduh format surat permohonan, isi, cap dan tandatangani oleh pimpinan, lalu unggah dokumennya.
          </p>
          <a href="/public/templates/format_surat_permohonan.pdf" download="format_surat_permohonan.pdf" className="text-primary hover:underline flex items-center gap-2">
            <Download className="w-4 h-4" /> Unduh Format Surat Permohonan
          </a>
          <p className="text-sm text-muted-foreground mt-2">Daftar lengkap sub bidang dapat dilihat di: <a href="https://example.com/list-subbidang" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link List Sub Bidang</a></p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Membuat...' : 'Buat Permohonan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


const Applications: React.FC = () => {
  const { user, isDocumentVerified } = useAuth();
  const { toast } = useToast();
  const [showNewApplicationForm, setShowNewApplicationForm] = useState(false);
  // isSubmittingApplication tetap di sini untuk menonaktifkan tombol di seluruh daftar
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false); 
  const queryClient = useQueryClient(); 
  const { handleError, handleSuccess } = useErrorHandler();

  const navigate = useNavigate();

  // Fungsi untuk mengambil data aplikasi
  const fetchApplicationsData = async (): Promise<ApplicationsResponse> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
    }

    const response = await fetch('/backend/api/applications/list.php', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (result.status === 'success') {
      return result.data;
    } else {
      throw new Error(result.message || 'Gagal memuat daftar permohonan');
    }
  };

  // Menggunakan useQuery untuk data aplikasi
  const { data, isLoading, error, refetch } = useQuery<ApplicationsResponse, Error>({
    queryKey: ['applications'],
    queryFn: fetchApplicationsData,
    enabled: isDocumentVerified, 
    staleTime: 1000 * 60, 
    refetchInterval: 1000 * 300, 
  });

  const applications = data?.applications || [];

  // Function to handle submitting a draft application
  const handleSubmitApplication = async (applicationId: string) => {
      setIsSubmittingApplication(true); // Aktifkan loading global
      try {
          const token = localStorage.getItem('token');
          if (!token) {
              throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
          }

          const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
          const csrfData = await csrfResponse.json();
          if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
              throw new Error(csrfData.message || 'Gagal mendapatkan token keamanan. Mohon refresh halaman.');
          }
          const csrfToken = csrfData.data.csrf_token;

          const response = await fetch('/backend/api/applications/submit.php', {
              method: 'POST', 
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'X-CSRF-Token': csrfToken,
              },
              body: JSON.stringify({ application_id: applicationId, csrf_token: csrfToken }),
          });

          const result = await response.json();

          if (result.status === 'success') {
              handleSuccess(result.message || 'Permohonan Anda berhasil disubmit dan sedang dalam proses review.', 'Permohonan Berhasil Disubmit');
              queryClient.invalidateQueries({ queryKey: ['applications'] }); 
          } else {
              handleError(new Error(result.message), 'application_submission');
          }
      } catch (error: any) {
          handleError(error, 'application_submission');
      } finally {
          setIsSubmittingApplication(false); // Nonaktifkan loading global
      }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const, icon: FileText, className: '' },
      submitted: { label: 'Disubmit', variant: 'outline' as const, icon: Clock, className: '' },
      under_review: { label: 'Dalam Review', variant: 'default' as const, icon: AlertTriangle, className: '' },
      approved: { label: 'Disetujui', variant: 'default' as const, icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      rejected: { label: 'Ditolak', variant: 'destructive' as const, icon: XCircle, className: '' },
      completed: { label: 'Selesai', variant: 'default' as const, icon: CheckCircle, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getApplicationTypeLabel = (type: string) => {
    const types = {
      new: 'Permohonan Baru',
      renewal: 'Perpanjangan',
      upgrade: 'Peningkatan',
    };
    return types[type as keyof typeof types] || type;
  };

  if (!isDocumentVerified) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Anda belum dapat mengajukan SBU. Silakan lengkapi dokumen registrasi perusahaan terlebih dahulu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Terjadi kesalahan: {error.message}. Mohon coba muat ulang halaman.</AlertDescription>
        </Alert>
        <div className="mt-4">
            <Button onClick={() => refetch()} variant="outline">
                Muat Ulang Permohonan
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Permohonan SBU</h1>
          <p className="text-muted-foreground">
            Kelola permohonan Sertifikat Badan Usaha Anda
          </p>
        </div>
        <Button
          onClick={() => setShowNewApplicationForm(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajukan SBU Baru
        </Button>
      </div>

      {/* Conditional rendering for New Application Form */}
      {showNewApplicationForm ? (
        <div className="mb-6">
          <NewApplicationForm onClose={() => {
            setShowNewApplicationForm(false);
          }} />
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{applications.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Dalam Proses</p>
                    <p className="text-2xl font-bold">
                      {applications.filter(app => ['submitted', 'under_review'].includes(app.status)).length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Disetujui</p>
                    <p className="text-2xl font-bold text-green-600">
                      {applications.filter(app => ['approved', 'completed'].includes(app.status)).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Draft</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {applications.filter(app => app.status === 'draft').length}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applications List */}
          {applications.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Belum Ada Permohonan</h3>
                <p className="text-muted-foreground mb-4">
                  Anda belum mengajukan permohonan SBU. Mulai dengan mengajukan SBU baru.
                </p>
                <Button onClick={() => setShowNewApplicationForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajukan SBU Baru
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {applications.map((app) => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg truncate">
                          {app.application_number}
                        </CardTitle>
                        <CardDescription className="space-y-1">
                          <div>{getApplicationTypeLabel(app.application_type)}</div>
                          <div className="text-xs">
                            Dibuat: {app.created_at_formatted}
                          </div>
                        </CardDescription>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Klasifikasi:</span>
                        <div className="text-muted-foreground">{app.requested_classification}</div>
                      </div>

                      <div>
                        <span className="font-medium">Bidang Usaha:</span>
                        <div className="text-muted-foreground">{app.business_field}</div>
                      </div>

                      {/* Tampilkan Kode Subbidang dan Nama Bidang */}
                      {app.sub_bidang_code && (
                        <div>
                          <span className="font-medium">Kode Subbidang:</span>
                          <div className="text-muted-foreground">{app.sub_bidang_code}</div>
                        </div>
                      )}
                      {app.bidang_name && (
                        <div>
                          <span className="font-medium">Nama Bidang:</span>
                          <div className="text-muted-foreground">{app.bidang_name}</div>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="font-medium">Kualifikasi:</span>
                        <Badge variant="outline">{app.company_qualification}</Badge>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-medium">Dokumen:</span>
                        <span className="text-muted-foreground">{app.document_count} file</span>
                      </div>
                    </div>

                    {app.submission_date_formatted && (
                      <div className="text-xs text-muted-foreground border-t pt-3">
                        Disubmit: {app.submission_date_formatted}
                      </div>
                    )}

                    {app.review_date_formatted && (
                      <div className="text-xs text-muted-foreground">
                        Direview: {app.review_date_formatted}
                      </div>
                    )}

                    {app.completion_date_formatted && (
                      <div className="text-xs text-muted-foreground">
                        Selesai: {app.completion_date_formatted}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Link to={`/applications/${app.code_reg}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                              <Eye className="w-4 h-4 mr-2" />
                              Detail
                          </Button>
                      </Link>

                      {app.status === 'completed' && (
                          <Button variant="outline" size="sm" className="flex-1">
                              <Download className="w-4 h-4 mr-2" />
                              Unduh
                          </Button>
                      )}
                      {/* Tombol Submit Permohonan (hanya jika status draft) */}
                      {app.status === 'draft' && (
                          // --- PERBAIKAN KRITIS: Pindahkan AlertDialog ke dalam loop ---
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button
                                      variant="default"
                                      size="sm"
                                      className="flex-1"
                                      disabled={isSubmittingApplication} 
                                  >
                                      <FileCheck className="w-4 h-4 mr-2" />
                                      {isSubmittingApplication ? 'Menyubmit...' : 'Submit Permohonan'}
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-md p-6 bg-white rounded-lg shadow-lg"> 
                                  <AlertDialogHeader className="text-center space-y-3">
                                      <div className="flex justify-center mb-2">
                                          <Send className="w-12 h-12 text-primary" /> 
                                      </div>
                                      <AlertDialogTitle className="text-2xl font-bold text-gray-800">
                                          Konfirmasi Pengajuan Permohonan
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-base text-gray-600">
                                          Anda akan mengajukan permohonan dengan nomor **{app.application_number}**.
                                          <br/><br/>
                                          **PENTING:** Setelah diajukan, permohonan ini tidak dapat diubah lagi. Pastikan semua informasi dan dokumen sudah benar.
                                          <br/><br/>
                                          Apakah Anda yakin ingin melanjutkan proses pengajuan?
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-3 mt-4"> 
                                      <AlertDialogCancel asChild>
                                          <Button variant="outline" className="w-full sm:w-auto">Batal</Button>
                                      </AlertDialogCancel>
                                      <AlertDialogAction asChild>
                                          <Button onClick={() => handleSubmitApplication(app.id)} disabled={isSubmittingApplication} className="w-full sm:w-auto bg-primary hover:bg-primary-dark">
                                            {isSubmittingApplication ? 'Mengirim...' : 'Ya, Ajukan Sekarang'}
                                          </Button>
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                          // --- AKHIR PERBAIKAN KRITIS ---
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Applications;