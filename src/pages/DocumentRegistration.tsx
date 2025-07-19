// File: src/pages/DocumentRegistration.tsx

import { useState, useEffect, useRef } from 'react';
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
import { FileText, Upload, X, Check, ExternalLink, Lock, AlertTriangle, Download } from 'lucide-react'; // Tambahkan Download icon, hapus ExternalLink jika tidak digunakan
import { Separator } from '@/components/ui/separator';

import { downloadAuthenticatedFile } from '@/lib/utils'; // Import fungsi helper

// Import tipe User dan Company dari file types
import type { User } from '@/types/user';
import type { Company } from '@/types/company';

// Skema validasi form sesuai dengan kolom database
const documentRegistrationSchema = z.object({
  companyName: z.string().min(1, 'Nama perusahaan wajib diisi'),
  businessEntityType: z.string().min(1, 'Bentuk badan usaha wajib dipilih'),
  companyEmail: z.string().email('Format email perusahaan tidak valid'),
  companyPhone: z.string().min(10, 'Nomor telepon perusahaan minimal 10 digit').max(15, 'Nomor telepon perusahaan maksimal 15 digit'),

  address: z.string().min(1, 'Alamat lengkap wajib diisi'),
  city: z.string().min(1, 'Kota wajib diisi'),
  postalCode: z.string().min(5, 'Kode pos harus 5 digit').max(5, 'Kode pos harus 5 digit'),
  province: z.string().min(1, 'Provinsi wajib dipilih'),
  regencyCity: z.string().min(1, 'Kabupaten/Kota wajib dipilih'),
  district: z.string().min(1, 'Kecamatan wajib dipilih'),
  village: z.string().min(1, 'Kelurahan wajib dipilih'),

  ktaKadinNumber: z.string().min(1, 'Nomor KTA KADIN wajib diisi'),
  ktaDate: z.string().min(1, 'Tanggal KTA wajib diisi').refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Format tanggal tidak valid",
  }),

  leaderName: z.string().min(1, 'Nama pimpinan wajib diisi'),
  leaderPosition: z.string().min(1, 'Jabatan wajib diisi'),
  leaderNik: z.string().min(16, 'NIK harus 16 digit').max(16, 'NIK harus 16 digit'),
  leaderNpwp: z.string().min(15, 'NPWP pimpinan tidak valid'),
});

type DocumentRegistrationForm = z.infer<typeof documentRegistrationSchema>;

// Interface untuk dokumen yang akan diupload di frontend
interface FileUploadState {
  type: string;
  label: string;
  required: boolean;
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
  backendId: string | null;
  fileUrl?: string;
  error: string | null;
}

// Daftar dokumen yang diperlukan berdasarkan `required_documents` table di database
const initialRequiredDocuments: Omit<FileUploadState, 'file' | 'uploading' | 'uploaded' | 'backendId' | 'fileUrl' | 'error'>[] = [
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

// Mock data lokasi (Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan)
const mockLocations = {
  provinces: [
    { id: '31', name: 'DKI Jakarta' },
    { id: '32', name: 'Jawa Barat' },
    { id: '33', name: 'Jawa Tengah' },
  ],
  regencies: {
    '31': [{ id: '3171', name: 'Kota Jakarta Pusat' }, { id: '3174', name: 'Kota Jakarta Selatan' }],
    '32': [{ id: '3204', name: 'Kabupaten Bandung' }, { id: '3275', name: 'Kota Bekasi' }],
    '33': [{ id: '3374', name: 'Kota Semarang' }, { id: '3303', name: 'Kabupaten Purbalingga' }],
  },
  districts: {
    '3171': [{ id: '3171010', name: 'Gambir' }, { id: '3171030', name: 'Tanah Abang' }],
    '3174': [{ id: '3174010', name: 'Kebayoran Baru' }, { id: '3174020', name: 'Cilandak' }],
  },
  villages: {
    '3171010': [{ id: '3171010001', name: 'Gambir' }, { id: '3171010002', name: 'Kebon Kelapa' }],
  },
};

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
    initialRequiredDocuments.map(doc => ({ ...doc, file: null, uploading: false, uploaded: false, backendId: null, error: null }))
  );
  
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedRegency, setSelectedRegency] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  const { toast } = useToast();
  const { user, company, updateUserStatus } = useAuth();

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

  useEffect(() => {
    if (user && company) {
      reset({
        companyName: company.company_name,
        businessEntityType: company.business_entity_type,
        companyEmail: company.company_email,
        companyPhone: company.company_phone,
        address: company.address,
        city: company.city,
        postalCode: company.postal_code,
        province: company.province,
        regencyCity: company.regency_city,
        district: company.district,
        village: company.village,
        ktaKadinNumber: company.kta_kadin_number,
        ktaDate: company.kta_date,
        leaderName: company.leader_name,
        leaderPosition: company.leader_position,
        leaderNik: company.leader_nik,
        leaderNpwp: company.leader_npwp,
      });

      setSelectedProvince(company.province);
      setSelectedRegency(company.regency_city);
      setSelectedDistrict(company.district);

      if (['pending_admin_approval', 'active', 'verified'].includes(user.status)) {
        setIsSubmitted(true);
      }
    }
    
    // Logika untuk mengisi status dokumen yang sudah diupload jika data tersedia
    if (user && user.documents) {
      setDocuments(prevDocs => 
        prevDocs.map(reqDoc => {
          const uploadedDoc = user.documents.find(doc => doc.document_type === reqDoc.type);
          if (uploadedDoc) {
            return {
              ...reqDoc,
              file: null, 
              uploaded: true,
              backendId: uploadedDoc.id,
              fileUrl: uploadedDoc.file_url, // URL sudah dari backend
              error: null
            };
          }
          return reqDoc;
        })
      );
    }
  }, [user, company, reset]);


  const formatNPWP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{1})(\d{3})(\d{3})/, '$1.$2.$3.$4-$5.$6');
    return formatted;
  };

  const handleNPWPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNPWP(e.target.value);
    setValue('leaderNpwp', formatted, { shouldValidate: true });
  };

  const handleNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (isSubmitted) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Terlalu Besar',
        description: 'Ukuran file maksimal 5MB',
        variant: 'destructive',
      });
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
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
      if (csrfData.status !== 'success') {
        throw new Error(csrfData.message || 'Gagal mendapatkan token keamanan.');
      }
      const csrfToken = csrfData.data.csrf_token;

      const formData = new FormData();
      formData.append('document', file);
      formData.append('document_type', documents[index].type);
      formData.append('category', 'initial_registration');
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
            // URL langsung ke download.php dengan nama file
            fileUrl: `/backend/api/documents/download.php?file_name=${encodeURIComponent(data.data.document.file_name)}`, 
            error: null
          } : doc
        ));
        
        toast({
          title: 'File Berhasil Diunggah',
          description: `${documents[index].label} telah berhasil diunggah.`,
        });
      } else {
        throw new Error(data.message || 'Gagal mengunggah dokumen.');
      }
    } catch (error) {
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
    if (isSubmitted) return;

    if (documentId) {
        try {
            const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
            const csrfData = await csrfResponse.json();
            if (csrfData.status !== 'success') {
                throw new Error(csrfData.message || 'Gagal mendapatkan token keamanan.');
            }
            const csrfToken = csrfData.data.csrf_token;

            const token = localStorage.getItem('token');
            const response = await fetch(`/backend/api/documents/delete.php`, { 
                method: 'POST', // atau 'DELETE'
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({
                  id: documentId,
                  csrf_token: csrfToken
                })
            });
            const data = await response.json();
            if (data.status !== 'success') {
                throw new Error(data.message || 'Gagal menghapus dokumen dari server.');
            }
            toast({
                title: 'Dokumen Dihapus',
                description: `${documents[index].label} berhasil dihapus dari server.`,
            });
        } catch (error) {
            toast({
                title: 'Gagal Menghapus Dokumen',
                description: error.message || 'Terjadi kesalahan saat menghapus dokumen dari server.',
                variant: 'destructive',
            });
            return;
        }
    }

    setDocuments(prev => prev.map((doc, i) => 
      i === index ? { ...doc, file: null, uploaded: false, backendId: null, fileUrl: undefined, error: null } : doc
    ));
  };


  const onSubmit = async (formData: DocumentRegistrationForm) => {
    const missingRequiredDocs = documents.filter(doc => doc.required && !doc.uploaded);
    if (missingRequiredDocs.length > 0) {
      toast({
        title: 'Dokumen Belum Lengkap',
        description: `Mohon lengkapi dokumen wajib berikut: ${missingRequiredDocs.map(d => d.label).join(', ')}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
      const csrfData = await csrfResponse.json();
      if (csrfData.status !== 'success') {
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
        await updateUserStatus();
        
        toast({
          title: 'Dokumen Registrasi Berhasil Dikirim',
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Gagal Mengirim Dokumen',
        description: error.message || 'Terjadi kesalahan saat mengirim dokumen registrasi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalDocuments = documents.length;
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

      <form onSubmit={handleSubmit(onSubmit)} className=" mt-6">
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
                  disabled={isSubmitted}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEntityType">Bentuk Badan Usaha</Label>
                <Select onValueChange={(value) => setValue('businessEntityType', value, { shouldValidate: true })} value={watch('businessEntityType')} disabled={isSubmitted}>
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
                    disabled={isSubmitted}
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
                    disabled={isSubmitted}
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
                disabled={isSubmitted}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            {/* Location Dropdowns */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Provinsi</Label>
                <Select onValueChange={(value) => {
                  setValue('province', value, { shouldValidate: true });
                  setSelectedProvince(value);
                  setValue('regencyCity', '', { shouldValidate: true }); 
                  setValue('district', '', { shouldValidate: true });
                  setValue('village', '', { shouldValidate: true });
                  setSelectedRegency('');
                  setSelectedDistrict('');
                }} value={watch('province')} disabled={isSubmitted}>
                  <SelectTrigger className={errors.province ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Pilih provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockLocations.provinces.map((province) => (
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
                <Select onValueChange={(value) => {
                  setValue('regencyCity', value, { shouldValidate: true });
                  setSelectedRegency(value);
                  setValue('district', '', { shouldValidate: true }); 
                  setValue('village', '', { shouldValidate: true });
                  setSelectedDistrict('');
                }} value={watch('regencyCity')} disabled={isSubmitted || !selectedProvince}>
                  <SelectTrigger className={errors.regencyCity ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Pilih kabupaten/kota" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockLocations.regencies[selectedProvince]?.map((regency) => (
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
                <Select onValueChange={(value) => {
                  setValue('district', value, { shouldValidate: true });
                  setSelectedDistrict(value);
                  setValue('village', '', { shouldValidate: true });
                }} value={watch('district')} disabled={isSubmitted || !selectedRegency}>
                  <SelectTrigger className={errors.district ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Pilih kecamatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockLocations.districts[selectedRegency]?.map((district) => (
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
                <Select onValueChange={(value) => setValue('village', value, { shouldValidate: true })} value={watch('village')} disabled={isSubmitted || !selectedDistrict}>
                  <SelectTrigger className={errors.village ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Pilih kelurahan" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockLocations.villages[selectedDistrict]?.map((village) => (
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
                disabled={isSubmitted}
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
                  disabled={isSubmitted}
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
                  disabled={isSubmitted}
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
                  disabled={isSubmitted}
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
                  disabled={isSubmitted}
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
                  disabled={isSubmitted}
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
                  maxLength={20}
                  {...register('leaderNpwp')}
                  className={errors.leaderNpwp ? 'border-destructive' : ''}
                  disabled={isSubmitted}
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index, document.backendId)}
                        disabled={isSubmitted || isLoading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
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
                      File berhasil diunggah: {document.file?.name || document.label}
                    </p>
                    {/* Menggunakan tombol Unduh dengan fungsi terautentikasi */}
                    {document.fileUrl && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => downloadAuthenticatedFile(document.fileUrl!, document.file?.name || document.original_name || 'document.pdf')
                           .catch(err => toast({ title: 'Unduh Gagal', description: err.message, variant: 'destructive' }))
                        }
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Unduh
                      </Button>
                    )}
                  </div>
                )}

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
                        e.target.value = '';
                      }}
                      className="hidden"
                      id={`file-${document.type}`}
                      disabled={isSubmitted || isLoading}
                    />
                    <label htmlFor={`file-${document.type}`}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        asChild
                        disabled={isSubmitted || isLoading}
                      >
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Pilih File
                        </span>
                      </Button>
                    </label>
                  </div>
                )}

                {/* Pesan error khusus upload file */}
                {document.error && (
                  <p className="text-sm text-destructive mt-2">{document.error}</p>
                )}

                {isSubmitted && !document.uploaded && (
                  <p className="text-sm text-muted-foreground mt-2">Dokumen belum diunggah.</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Button */}
        {!isSubmitted && (
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isLoading || uploadedDocumentsCount === 0}>
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