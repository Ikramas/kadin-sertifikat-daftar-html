// File: src/pages/DocumentRegistration.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Upload, X, Check, Lock, AlertTriangle, Download } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

import { downloadAuthenticatedFile } from '@/lib/utils';

import type { User } from '@/types/user';
import type { Company, Document } from '@/types/company';

// Define types for location data
interface LocationItem {
  id: string;
  name: string;
}

// Skema validasi form sesuai dengan kolom database
const documentRegistrationSchema = z.object({
  companyName: z.string().min(1, 'Nama perusahaan wajib diisi'),
  businessEntityType: z.string().min(1, 'Bentuk badan usaha wajib dipilih'),
  companyEmail: z.string().email('Format email perusahaan tidak valid'),
  companyPhone: z.string().min(10, 'Nomor telepon perusahaan minimal 10 digit').max(15, 'Nomor telepon perusahaan maksimal 15 digit'),

  address: z.string().min(1, 'Alamat lengkap wajib diisi'),
  // City is typically derived from regencyCity in ID wilayah API, but keeping as string for direct input flexibility if needed.
  city: z.string().min(1, 'Kota wajib diisi'),
  postalCode: z.string()
    .min(5, 'Kode pos harus 5 digit')
    .max(5, 'Kode pos harus 5 digit')
    .regex(/^\d{5}$/, 'Kode pos harus 5 digit angka'),
  province: z.string().min(1, 'Provinsi wajib dipilih'), // Will store name
  regencyCity: z.string().min(1, 'Kabupaten/Kota wajib dipilih'), // Will store name
  district: z.string().min(1, 'Kecamatan wajib dipilih'), // Will store name
  village: z.string().min(1, 'Kelurahan wajib dipilih'), // Will store name

  ktaKadinNumber: z.string().min(1, 'Nomor KTA KADIN wajib diisi'),
  ktaDate: z.string().refine((val) => {
    if (!val) return false; // Required check
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, {
    message: "Format tanggal tidak valid (YYYY-MM-DD)",
  }),

  leaderName: z.string().min(1, 'Nama pimpinan wajib diisi'),
  leaderPosition: z.string().min(1, 'Jabatan wajib diisi'),
  leaderNik: z.string()
    .min(16, 'NIK harus 16 digit')
    .max(16, 'NIK harus 16 digit')
    .regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
  leaderNpwp: z.string().min(15, 'NPWP pimpinan tidak valid').regex(/^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/, 'Format NPWP tidak valid (XX.XXX.XXX.X-XXX.XXX)'),
});

type DocumentRegistrationForm = z.infer<typeof documentRegistrationSchema>;

interface FileUploadState {
  type: string;
  label: string; // <-- Ini properti 'label' yang Anda butuhkan
  required: boolean;
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  backendId: string | null;
  original_name?: string;
  fileUrl?: string;
  error: string | null;
}

const initialRequiredDocuments: Omit<FileUploadState, 'file' | 'uploading' | 'uploaded' | 'backendId' | 'fileUrl' | 'original_name' | 'error'>[] = [
  { type: 'kta_kadin_terakhir', label: 'KTA Kadin Terakhir', required: true },
  { type: 'nib', label: 'NIB (Nomor Induk Berusaha)', required: true },
  { type: 'akta_pendirian', label: 'Akta Pendirian', required: true },
  { type: 'akta_perubahan', label: 'Akta Perubahan', required: false },
  { type: 'npwp_perusahaan', label: 'NPWP Perusahaan', required: true },
  { type: 'sk_kemenkumham', label: 'SK Kemenkumham', required: true },
  { type: 'ktp_pimpinan', label: 'KTP Pimpinan', required: true },
  { type: 'npwp_pimpinan', label: 'NPWP Pimpinan', required: true },
  { type: 'pasfoto_pimpinan', label: 'Pasfoto Pimpinan', required: true },
];

const BUSINESS_ENTITY_TYPES = [
  { value: 'PT', label: 'PT (Perseroan Terbatas)' },
  { value: 'CV', label: 'CV (Commanditaire Vennootschap)' },
  { value: 'Firma', label: 'Firma' },
  { value: 'Koperasi', label: 'Koperasi' },
  { value: 'Perorangan', label: 'Perorangan' },
  { value: 'Lainnya', label: 'Lainnya' },
];

export default function DocumentRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [documents, setDocuments] = useState<FileUploadState[]>(
    initialRequiredDocuments.map(doc => ({ ...doc, file: null, uploading: false, uploaded: false, backendId: null, original_name: undefined, fileUrl: undefined, error: null }))
  );

  // States for API fetched location data
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [regencies, setRegencies] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [villages, setVillages] = useState<LocationItem[]>([]);

  // States to hold selected IDs for cascading dropdowns, needed for fetching next level data
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');

  // Flag to ensure form initialization logic runs only once
  const isFormInitialized = useRef(false);

  const { toast } = useToast();
  const { user, company, fetchUserProfile } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<DocumentRegistrationForm>({
    resolver: zodResolver(documentRegistrationSchema),
    mode: 'onChange',
  });

  const watchProvince = watch('province');
  const watchRegencyCity = watch('regencyCity');
  const watchDistrict = watch('district');

  // --- API Fetching for Locations (using backend proxy) ---
  const fetchProvinces = useCallback(async () => {
    try {
      const response = await fetch('/backend/api/wilayah-proxy.php?path=provinces');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseBody = await response.json();

      const actualData = responseBody.data; // Data array ada di properti 'data'

      if (Array.isArray(actualData)) {
        setProvinces(actualData);
        return actualData;
      } else {
        console.error('API response for provinces was not an array or data property missing:', responseBody);
        toast({
          title: 'Gagal Memuat Data',
          description: 'Format respons API untuk provinsi tidak sesuai. Mohon coba lagi.',
          variant: 'destructive',
        });
        return [];
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
      toast({
        title: 'Gagal Memuat Data',
        description: 'Terjadi kesalahan saat memuat daftar provinsi. Pastikan server backend berjalan dan API Wilayah dapat diakses.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const fetchRegencies = useCallback(async (provinceId: string) => {
    if (!provinceId) {
      setRegencies([]);
      return [];
    }
    try {
      const response = await fetch(`/backend/api/wilayah-proxy.php?path=regencies/${provinceId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseBody = await response.json();

      const actualData = responseBody.data;

      if (Array.isArray(actualData)) {
        setRegencies(actualData);
        return actualData;
      } else {
        console.error('API response for regencies was not an array or data property missing:', responseBody);
        toast({
          title: 'Gagal Memuat Data',
          description: 'Format respons API untuk kabupaten/kota tidak sesuai. Mohon coba lagi.',
          variant: 'destructive',
        });
        return [];
      }
    } catch (error) {
      console.error('Error fetching regencies:', error);
      toast({
        title: 'Gagal Memuat Data',
        description: 'Terjadi kesalahan saat memuat daftar kabupaten/kota.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const fetchDistricts = useCallback(async (regencyId: string) => {
    if (!regencyId) {
      setDistricts([]);
      return [];
    }
    try {
      const response = await fetch(`/backend/api/wilayah-proxy.php?path=districts/${regencyId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseBody = await response.json();

      const actualData = responseBody.data;

      if (Array.isArray(actualData)) {
        setDistricts(actualData);
        return actualData;
      } else {
        console.error('API response for districts was not an array or data property missing:', responseBody);
        toast({
          title: 'Gagal Memuat Data',
          description: 'Format respons API untuk kecamatan tidak sesuai. Mohon coba lagi.',
          variant: 'destructive',
        });
        return [];
      }
    }
    catch (error) {
      console.error('Error fetching districts:', error);
      toast({
        title: 'Gagal Memuat Data',
        description: 'Terjadi kesalahan saat memuat daftar kecamatan.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const fetchVillages = useCallback(async (districtId: string) => {
    if (!districtId) {
      setVillages([]);
      return [];
    }
    try {
      const response = await fetch(`/backend/api/wilayah-proxy.php?path=villages/${districtId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseBody = await response.json();

      const actualData = responseBody.data;

      if (Array.isArray(actualData)) {
        setVillages(actualData);
        return actualData;
      } else {
        console.error('API response for villages was not an array or data property missing:', responseBody);
        toast({
          title: 'Gagal Memuat Data',
          description: 'Format respons API untuk kelurahan tidak sesuai. Mohon coba lagi.',
          variant: 'destructive',
        });
        return [];
      }
    } catch (error) {
      console.error('Error fetching villages:', error);
      toast({
        title: 'Gagal Memuat Data',
        description: 'Terjadi kesalahan saat memuat daftar kelurahan.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);
  // --- End API Fetching for Locations ---

  // Initial fetch for provinces on component mount
  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces]);

  // Handle cascading fetches based on selections
  useEffect(() => {
    if (selectedProvinceId) {
      fetchRegencies(selectedProvinceId);
    }
  }, [selectedProvinceId, fetchRegencies]);

  useEffect(() => {
    if (selectedRegencyId) {
      fetchDistricts(selectedRegencyId);
    }
  }, [selectedRegencyId, fetchDistricts]);

  useEffect(() => {
    if (selectedDistrictId) {
      fetchVillages(selectedDistrictId);
    }
  }, [selectedDistrictId, fetchVillages]);

  // Effect for initializing form data and documents from user/company profile
  useEffect(() => {
    const initializeFormDataAndDocuments = async () => {
      // Hentikan jika form sudah diinisialisasi
      if (isFormInitialized.current) {
        return;
      }
      // Hentikan jika data user atau company belum tersedia (menunggu dari AuthContext)
      // atau jika daftar provinsi belum terisi (menunggu dari API wilayah)
      if (!user || !company || provinces.length === 0) {
        return;
      }

      // 1. Inisialisasi data form dari objek 'company'
      reset({
        companyName: company.company_name || '',
        businessEntityType: company.business_entity_type || '',
        companyEmail: company.company_email || '',
        companyPhone: company.company_phone || '',
        address: company.address || '',
        city: company.city || '', // city might not be directly from API, keep as is
        postalCode: company.postal_code || '',
        ktaKadinNumber: company.kta_kadin_number || '',
        ktaDate: company.kta_date || '', // Date format 'YYYY-MM-DD' is expected by input type="date"
        leaderPosition: company.leader_position || '',
        leaderNik: company.leader_nik || '',
        leaderNpwp: company.leader_npwp || '',
        province: company.province || '',
        regencyCity: company.regency_city || '',
        district: company.district || '',
        village: company.village || '',
        // --- PERBAIKAN: Setel nilai leaderName dari user.name ---
        leaderName: user.name || '', 
        // --- AKHIR PERBAIKAN ---
      });

      // 2. Inisialisasi dropdown lokasi berdasarkan data 'company'
      // Fetch data cascading to ensure correct IDs are set for subsequent fetches
      const initialProvince = provinces.find(p => p.name === company.province);
      if (initialProvince) {
        setSelectedProvinceId(initialProvince.id);
        const fetchedRegencies = await fetchRegencies(initialProvince.id);
        const initialRegency = fetchedRegencies?.find((r: LocationItem) => r.name === company.regency_city);
        if (initialRegency) {
          setSelectedRegencyId(initialRegency.id);
          const fetchedDistricts = await fetchDistricts(initialRegency.id);
          const initialDistrict = fetchedDistricts?.find((d: LocationItem) => d.name === company.district);
          if (initialDistrict) {
            setSelectedDistrictId(initialDistrict.id);
            // fetchVillages will be triggered by useEffect watchDistrict
          }
        }
      }

      // 3. Inisialisasi status dokumen dari user.documents
      if (user.documents && user.documents.length > 0) {
        setDocuments(prevDocs =>
          prevDocs.map(reqDoc => {
            const uploadedDoc = user.documents?.find(doc => doc.document_type === reqDoc.type);
            if (uploadedDoc) {
              return {
                ...reqDoc,
                file: null, // File objek tidak disimpan, hanya metadata
                uploading: false,
                uploaded: true,
                backendId: uploadedDoc.id,
                fileUrl: uploadedDoc.file_url,
                original_name: uploadedDoc.original_name,
                error: null
              };
            }
            return reqDoc;
          })
        );
      }

      // 4. Set status form menjadi submitted jika user.status sesuai
      if (['pending_admin_approval', 'active', 'verified'].includes(user.status)) {
        setIsSubmitted(true);
      }

      // Set flag bahwa inisialisasi sudah selesai
      isFormInitialized.current = true;
    };

    // Panggil fungsi inisialisasi ketika semua dependensi tersedia dan belum diinisialisasi
    if (!isFormInitialized.current && user && company && provinces.length > 0) {
      initializeFormDataAndDocuments();
    }

  }, [user, company, reset, provinces, fetchRegencies, fetchDistricts, fetchVillages]); // Dependensi lengkap

  // --- PERBAIKAN: Refactor formatNPWP agar lebih progresif ---
  const formatNPWP = (value: string) => {
    // Hapus semua karakter non-digit kecuali tanda hubung yang ada di posisi yang benar
    // untuk menghindari masalah saat membersihkan.
    const cleanValue = value.replace(/\D/g, ''); // Hapus semua non-digit dulu

    let formatted = cleanValue;
    // Format NPWP: XX.XXX.XXX.X-XXX.XXX
    if (formatted.length > 2) {
      formatted = `${formatted.substring(0, 2)}.${formatted.substring(2)}`;
    }
    if (formatted.length > 6) { // Setelah penambahan titik pertama, panjangnya bertambah
      formatted = `${formatted.substring(0, 6)}.${formatted.substring(6)}`;
    }
    if (formatted.length > 10) { // Setelah penambahan titik kedua
      formatted = `${formatted.substring(0, 10)}.${formatted.substring(10)}`;
    }
    if (formatted.length > 12) { // Setelah penambahan titik ketiga
      formatted = `${formatted.substring(0, 12)}-${formatted.substring(12)}`;
    }
    if (formatted.length > 16) { // Setelah penambahan tanda hubung
      formatted = `${formatted.substring(0, 16)}.${formatted.substring(16)}`;
    }
    return formatted;
  };
  // --- AKHIR PERBAIKAN ---

  const handleNPWPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNPWP(e.target.value);
    setValue('leaderNpwp', formatted, { shouldValidate: true });
  };

  // Only allow numbers for specific fields
  const handleNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow numbers, backspace, delete, tab, enter, arrow keys
    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (isSubmitted || isLoading) return; // Tidak bisa unggah jika form sudah disubmit/terkunci atau sedang loading

    // Reset error for current document before new upload attempt
    setDocuments(prev => prev.map((doc, i) =>
      i === index ? { ...doc, error: null } : doc
    ));

    if (file.size > 5 * 1024 * 1024) { // Max 5MB
      setDocuments(prev => prev.map((doc, i) =>
        i === index ? { ...doc, error: 'Ukuran file maksimal 5MB' } : doc
      ));
      toast({
        title: 'File Terlalu Besar',
        description: 'Ukuran file maksimal 5MB',
        variant: 'destructive',
      });
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setDocuments(prev => prev.map((doc, i) =>
        i === index ? { ...doc, error: 'Format file tidak valid. Hanya PDF, JPG, PNG.' } : doc
      ));
      toast({
        title: 'Format File Tidak Valid',
        description: 'File harus berformat PDF, JPG, atau PNG',
        variant: 'destructive',
      });
      return;
    }

    setDocuments(prev => prev.map((doc, i) =>
      i === index ? { ...doc, file, uploading: true, uploaded: false, error: null } : doc
    ));

    try {
      const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
      const csrfData = await csrfResponse.json();
      if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
        throw new Error(csrfData.message || 'Gagal mendapatkan token keamanan.');
      }
      const csrfToken = csrfData.data.csrf_token;

      const formData = new FormData();
      formData.append('document', file);
      formData.append('document_type', documents[index].type);
      // --- PERBAIKAN KRITIS: Ubah kategori menjadi 'initial_registration_temp' ---
      formData.append('category', 'initial_registration_temp');
      // --- AKHIR PERBAIKAN KRITIS ---
      formData.append('csrf_token', csrfToken);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      }

      const uploadResponse = await fetch('/backend/api/documents/upload.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        body: formData,
      });

      const data = await uploadResponse.json();

      if (data.status === 'success') {
        setDocuments(prev => prev.map((doc, i) =>
          i === index ? {
            ...doc,
            uploading: false,
            uploaded: true,
            backendId: data.data.document.id,
            fileUrl: data.data.document.file_url,
            original_name: data.data.document.original_name,
            error: null
          } : doc
        ));

        // Akses properti 'label' dari objek documents[index]
        toast({
          title: 'File Berhasil Diunggah',
          description: `${documents[index].label} telah berhasil diunggah.`,
        });
      } else {
        throw new Error(data.message || 'Gagal mengunggah dokumen.');
      }
    } catch (error: any) {
      setDocuments(prev => prev.map((doc, i) =>
        i === index ? { ...doc, uploading: false, uploaded: false, error: error.message } : doc
      ));

      toast({
        title: 'Gagal Mengunggah File',
        description: error.message || 'Terjadi kesalahan saat mengunggah file.',
        variant: 'destructive',
      });
    }
  };

  const removeFile = async (index: number, documentId: string | null) => {
    if (isSubmitted || isLoading) return; // Tidak bisa menghapus jika form sudah disubmit/terkunci atau sedang loading

    if (documentId) {
        try {
            const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
            const csrfData = await csrfResponse.json();
            if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
                throw new Error(csrfData.message || 'Gagal mendapatkan token keamanan. Mohon refresh halaman.');
            }
            const csrfToken = csrfData.data.csrf_token;

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
            }

            // --- PERBAIKAN KRITIS: Panggil endpoint delete dokumen di backend ---
            const deleteResponse = await fetch('/backend/api/documents/delete.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-CSRF-Token': csrfToken, // Sertakan token CSRF di header
                },
                body: JSON.stringify({ document_id: documentId, csrf_token: csrfToken }), // Sertakan token CSRF di body
            });

            const deleteData = await deleteResponse.json();

            if (deleteData.status === 'success') {
                setDocuments(prev => prev.map((doc, i) =>
                    i === index ? { ...doc, file: null, uploaded: false, backendId: null, fileUrl: undefined, original_name: undefined, error: null } : doc
                ));
                toast({
                    title: 'File Berhasil Dihapus',
                    description: `Dokumen ${documents[index].label} berhasil dihapus dari server.`,
                });
            } else {
                throw new Error(deleteData.message || 'Gagal menghapus dokumen dari server.');
            }
        } catch (error: any) {
            toast({
                title: 'Gagal Menghapus File',
                description: error.message || 'Terjadi kesalahan saat menghapus dokumen.',
                variant: 'destructive',
            });
            // Jika terjadi error, mungkin ingin mengembalikan status dokumen ke uploaded
            setDocuments(prev => prev.map((doc, i) =>
              i === index ? { ...doc, uploading: false, uploaded: true, error: error.message } : doc
            ));
        }
        return;
    }

    // Jika tidak ada backendId, cukup hapus state lokal
    setDocuments(prev => prev.map((doc, i) =>
      i === index ? { ...doc, file: null, uploaded: false, backendId: null, fileUrl: undefined, original_name: undefined, error: null } : doc
    ));
    toast({
      title: 'File Dihapus',
      description: `Status ${documents[index].label} direset di form.`,
    });
  };


  const onSubmit = async (formData: DocumentRegistrationForm) => {
    setIsLoading(true);

    // Pastikan dokumen wajib sudah diunggah sebelum submit form
    const missingRequiredDocs = documents.filter(doc => doc.required && !doc.uploaded);
    if (missingRequiredDocs.length > 0) {
      toast({
        title: 'Dokumen Belum Lengkap',
        description: `Mohon lengkapi dokumen wajib berikut: ${missingRequiredDocs.map(d => d.label).join(', ')}.`,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
      const csrfData = await csrfResponse.json();
      if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
        throw new Error(csrfData.message || 'Gagal mendapatkan token keamanan.');
      }
      const csrfToken = csrfData.data.csrf_token;

      const uploadedDocumentIds: { [key: string]: string } = {};
      documents.forEach(doc => {
        if (doc.uploaded && doc.backendId) {
          uploadedDocumentIds[doc.type] = doc.backendId;
        }
      });

      const submissionData = {
        ...formData,
        // Ensure companyPhone and companyEmail are passed correctly as they are in schema
        companyPhone: formData.companyPhone,
        companyEmail: formData.companyEmail,
        uploadedDocuments: uploadedDocumentIds,
        csrf_token: csrfToken
      };

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      }

      const response = await fetch('/backend/api/registrations/initial-document-submit.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setIsSubmitted(true);
        // Refresh user profile in AuthContext to get updated company status
        await fetchUserProfile(); 

        toast({
          title: 'Dokumen Registrasi Berhasil Dikirim',
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Gagal Mengirim Dokumen',
        description: error.message || 'Terjadi kesalahan saat mengirim dokumen registrasi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalDocuments = initialRequiredDocuments.length;
  const uploadedDocumentsCount = documents.filter(doc => doc.uploaded).length;
  const uploadProgress = (uploadedDocumentsCount / totalDocuments) * 100;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dokumen Registrasi</h1>
        <p className="text-muted-foreground">
          Lengkapi data dan dokumen perusahaan untuk mengaktifkan semua fitur portal
        </p>
      </div>

      {isSubmitted && (
        <Card className="border-success bg-success/10 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-success" />
              <div>
                <h3 className="font-semibold text-success">Dokumen Sudah Dikirim</h3>
                <p className="text-sm text-muted-foreground">
                  Dokumen registrasi Anda sedang dalam proses verifikasi admin.
                  Form telah dikunci untuk mencegah perubahan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Progress Upload Dokumen</h3>
            <span className="text-sm text-muted-foreground">
              {uploadedDocumentsCount} dari {totalDocuments} dokumen
            </span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className=" mt-6 space-y-6"> {/* Added space-y-6 */}
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Perusahaan</CardTitle>
            <CardDescription>Pastikan informasi perusahaan Anda akurat dan lengkap.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nama Perusahaan</Label>
                <Input
                  id="companyName"
                  placeholder="PT. Contoh Perusahaan"
                  {...register('companyName')}
                  className={errors.companyName ? 'border-destructive' : ''}
                  disabled={isSubmitted || isLoading}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEntityType">Bentuk Badan Usaha</Label>
                <Select onValueChange={(value) => setValue('businessEntityType', value, { shouldValidate: true })} value={watch('businessEntityType')} disabled={isSubmitted || isLoading}>
                  <SelectTrigger className={errors.businessEntityType ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Pilih bentuk badan usaha" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_ENTITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.businessEntityType && (
                  <p className="text-sm text-destructive">{errors.businessEntityType.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email Perusahaan</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    placeholder="company@example.com"
                    {...register('companyEmail')}
                    className={errors.companyEmail ? 'border-destructive' : ''}
                    disabled={isSubmitted || isLoading}
                  />
                {errors.companyEmail && (
                  <p className="text-sm text-destructive">{errors.companyEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyPhone">Telepon Perusahaan</Label>
                  <Input
                    id="companyPhone"
                    type="tel"
                    placeholder="021-xxxxxxxx"
                    onKeyPress={handleNumberInput}
                    {...register('companyPhone')}
                    className={errors.companyPhone ? 'border-destructive' : ''}
                    disabled={isSubmitted || isLoading}
                  />
                {errors.companyPhone && (
                  <p className="text-sm text-destructive">{errors.companyPhone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap Perusahaan</Label>
              <Textarea
                id="address"
                placeholder="Jl. Contoh No. 123, RT/RW 01/02"
                rows={3}
                {...register('address')}
                className={errors.address ? 'border-destructive' : ''}
                disabled={isSubmitted || isLoading}
              />
              {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
            </div>

            {/* Location Dropdowns - API Integration */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Provinsi</Label>
                <Select
                  onValueChange={async (value) => {
                    // Find province name based on ID
                    const provinceName = provinces.find(p => p.id === value)?.name || '';
                    setValue('province', provinceName, { shouldValidate: true });
                    setSelectedProvinceId(value);
                    // Reset lower level fields and states
                    setValue('regencyCity', '', { shouldValidate: true });
                    setValue('district', '', { shouldValidate: true });
                    setValue('village', '', { shouldValidate: true });
                    setRegencies([]);
                    setDistricts([]);
                    setVillages([]);
                    setSelectedRegencyId('');
                    setSelectedDistrictId('');
                  }}
                  value={provinces.find(p => p.name === watchProvince)?.id || ''}
                  disabled={isSubmitted || isLoading || provinces.length === 0}
                >
                  <SelectTrigger className={errors.province ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Pilih provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.province && (
                  <p className="text-sm text-destructive">{errors.province.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="regencyCity">Kabupaten/Kota</Label>
                <Select
                  onValueChange={async (value) => {
                    // Find regency name based on ID
                    const regencyName = regencies.find(r => r.id === value)?.name || '';
                    setValue('regencyCity', regencyName, { shouldValidate: true });
                    setSelectedRegencyId(value);
                    // Reset lower level fields and states
                    setValue('district', '', { shouldValidate: true });
                    setValue('village', '', { shouldValidate: true });
                    setDistricts([]);
                    setVillages([]);
                    setSelectedDistrictId('');
                  }}
                  value={regencies.find(r => r.name === watchRegencyCity)?.id || ''}
                  disabled={isSubmitted || isLoading || !selectedProvinceId || regencies.length === 0}
                >
                  <SelectTrigger className={errors.regencyCity ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Pilih kabupaten/kota" />
                  </SelectTrigger>
                  <SelectContent>
                    {regencies.map((regency) => (
                      <SelectItem key={regency.id} value={regency.id}>
                        {regency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.regencyCity && (
                  <p className="text-sm text-destructive">{errors.regencyCity.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">Kecamatan</Label>
                <Select
                  onValueChange={async (value) => {
                    // Find district name based on ID
                    const districtName = districts.find(d => d.id === value)?.name || '';
                    setValue('district', districtName, { shouldValidate: true });
                    setSelectedDistrictId(value);
                    // Reset lower level fields and states
                    setValue('village', '', { shouldValidate: true });
                    setVillages([]);
                  }}
                  value={districts.find(d => d.name === watchDistrict)?.id || ''}
                  disabled={isSubmitted || isLoading || !selectedRegencyId || districts.length === 0}
                >
                  <SelectTrigger className={errors.district ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Pilih kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem key={district.id} value={district.id}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.district && (
                  <p className="text-sm text-destructive">{errors.district.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="village">Kelurahan</Label>
                <Select
                  onValueChange={(value) => {
                    // Find village name based on ID
                    const villageName = villages.find(v => v.id === value)?.name || '';
                    setValue('village', villageName, { shouldValidate: true });
                  }}
                  value={villages.find(v => v.name === watch('village'))?.id || ''}
                  disabled={isSubmitted || isLoading || !selectedDistrictId || villages.length === 0}
                >
                  <SelectTrigger className={errors.village ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Pilih kelurahan" />
                  </SelectTrigger>
                  <SelectContent>
                    {villages.map((village) => (
                      <SelectItem key={village.id} value={village.id}>
                        {village.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.village && (
                  <p className="text-sm text-destructive">{errors.village.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Kode Pos</Label>
              <Input
                id="postalCode"
                placeholder="12345"
                onKeyPress={handleNumberInput}
                maxLength={5}
                {...register('postalCode')}
                className={errors.postalCode ? 'border-destructive' : ''}
                disabled={isSubmitted || isLoading}
              />
              {errors.postalCode && (
                <p className="text-sm text-destructive">{errors.postalCode.message}</p>
              )}
            </div>

            <Separator className="my-4" />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ktaKadinNumber">Nomor KTA KADIN Aktif</Label>
                <Input
                  id="ktaKadinNumber"
                  placeholder="KTA-123456"
                  {...register('ktaKadinNumber')}
                  className={errors.ktaKadinNumber ? 'border-destructive' : ''}
                  disabled={isSubmitted || isLoading}
                />
                {errors.ktaKadinNumber && (
                  <p className="text-sm text-destructive">{errors.ktaKadinNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ktaDate">Tanggal KTA</Label>
                <Input
                  id="ktaDate"
                  type="date"
                  {...register('ktaDate')}
                  className={errors.ktaDate ? 'border-destructive' : ''}
                  disabled={isSubmitted || isLoading}
                />
                {errors.ktaDate && (
                  <p className="text-sm text-destructive">{errors.ktaDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leader Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pimpinan</CardTitle>
            <CardDescription>Detail pimpinan utama perusahaan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leaderName">Nama Pimpinan</Label>
                <Input
                  id="leaderName"
                  placeholder="Nama lengkap pimpinan"
                  {...register('leaderName')}
                  className={errors.leaderName ? 'border-destructive' : ''}
                  disabled={isSubmitted || isLoading}
                />
                {errors.leaderName && (
                  <p className="text-sm text-destructive">{errors.leaderName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaderPosition">Jabatan</Label>
                <Input
                  id="leaderPosition"
                  placeholder="Direktur Utama"
                  {...register('leaderPosition')}
                  className={errors.leaderPosition ? 'border-destructive' : ''}
                  disabled={isSubmitted || isLoading}
                />
                {errors.leaderPosition && (
                  <p className="text-sm text-destructive">{errors.leaderPosition.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leaderNik">NIK</Label>
                <Input
                  id="leaderNik"
                  placeholder="1234567890123456"
                  onKeyPress={handleNumberInput}
                  maxLength={16}
                  {...register('leaderNik')}
                  className={errors.leaderNik ? 'border-destructive' : ''}
                  disabled={isSubmitted || isLoading}
                />
                {errors.leaderNik && (
                  <p className="text-sm text-destructive">{errors.leaderNik.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaderNpwp">NPWP Pimpinan</Label>
                <Input
                  id="leaderNpwp"
                  placeholder="00.000.000.0-000.000"
                  onChange={handleNPWPChange}
                  maxLength={20} // Batasi panjang input yang diformat
                  {...register('leaderNpwp')}
                  className={errors.leaderNpwp ? 'border-destructive' : ''}
                  disabled={isSubmitted || isLoading}
                />
                {errors.leaderNpwp && (
                  <p className="text-sm text-destructive">{errors.leaderNpwp.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Dokumen</CardTitle>
            <p className="text-sm text-muted-foreground">
              Semua dokumen wajib kecuali yang bertanda opsional. Format: PDF, JPG, PNG (Max: 5MB)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents.map((document, index) => (
              <div key={document.type} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium">{document.label}</span>
                    {document.required && <span className="text-destructive ml-1">*</span>}
                    {!document.required && (
                      <span className="text-xs text-muted-foreground ml-1">(Opsional)</span>
                    )}
                  </div>
                  {document.uploaded ? (
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-success" />
                      {/* Tombol hapus hanya aktif jika form belum disubmit */}
                      {!isSubmitted && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index, document.backendId)}
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ) : document.uploading ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : null}
                </div>

                {document.file && document.uploading && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Mengupload: {document.file.name}</p>
                    <Progress value={75} className="w-full" />
                  </div>
                )}

                {document.uploaded && (
                  <div className="space-y-2">
                    <p className="text-sm text-success">
                      File berhasil diunggah: {document.original_name || document.label}
                    </p>
                    {document.fileUrl && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => downloadAuthenticatedFile(document.fileUrl!, document.original_name || document.label || 'document.pdf')
                           .catch((err: any) => toast({ title: 'Unduh Gagal', description: err.message, variant: 'destructive' }))
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Unduh
                      </Button>
                    )}
                  </div>
                )}

                {/* Input file hanya muncul jika belum diunggah dan form tidak disubmit */}
                {!document.uploaded && !document.uploading && !isSubmitted && (
                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(index, file);
                        }
                        e.target.value = ''; // Clear input field
                      }}
                      className="hidden"
                      id={`file-${document.type}`}
                      disabled={isLoading}
                    />
                    <label htmlFor={`file-${document.type}`}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        asChild
                      >
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Pilih File
                        </span>
                      </Button>
                    </label>
                  </div>
                )}

                {document.error && (
                  <p className="text-sm text-destructive mt-2">{document.error}</p>
                )}

                {/* Pesan ini tampil jika form disubmit tapi dokumen ini belum diunggah (misal opsional) */}
                {isSubmitted && !document.uploaded && (
                  <p className="text-sm text-muted-foreground mt-2">Dokumen ini belum diunggah.</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Button */}
        {!isSubmitted && (
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isLoading || uploadedDocumentsCount === 0 || uploadProgress < 100}>
              {isLoading ? 'Menyimpan...' : 'Submit Dokumen Registrasi'}
            </Button>
          </div>
        )}
        {isSubmitted && (
          <div className="flex justify-center p-4">
            <Button variant="outline" disabled>
              <Check className="w-4 h-4 mr-2" />
              Dokumen Sudah Disubmit
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}