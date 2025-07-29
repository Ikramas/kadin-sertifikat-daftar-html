// src/pages/Profile.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Building2, Calendar, Shield, MapPin, CreditCard, FileText, ExternalLink, Download } from 'lucide-react'; 
import { useErrorHandler } from '@/hooks/useErrorHandler'; 

import type { User as UserData } from '@/types/user';
import type { Company as CompanyData } from '@/types/company'; 

// Interface untuk data dokumen yang diharapkan dari API
interface DocumentData {
  id: string;
  original_name: string;
  file_name: string;
  document_type: string;
  status: string;
  file_url?: string; // URL lengkap file, diharapkan dari backend
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Karena useErrorHandler sekarang menggunakan useCallback, handleError akan stabil
  const { handleError, handleSuccess } = useErrorHandler(); 
  
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [userDocuments, setUserDocuments] = useState<DocumentData[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile data including company data and documents
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token'); 
        if (!token) {
          setIsLoading(false);
          // Mungkin tambahkan redirect ke login jika tidak ada token
          // navigate('/login'); 
          return;
        }

        const response = await fetch('/backend/api/users/profile.php', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json(); 
        if (data.status === 'success') {
          if (data.data.company) {
            setCompanyData(data.data.company); 
          }
          if (data.data.documents) { 
            setUserDocuments(data.data.documents); 
          }
        } else {
          handleError(new Error(data.message || 'Gagal memuat profil pengguna.'), 'profile_fetch');
        }
      } catch (error) {
        handleError(error, 'profile_fetch');
      } finally {
        setIsLoading(false); 
      }
    };

    // Panggil fungsi fetchProfileData hanya sekali saat komponen di-mount
    // atau jika user?.id berubah (walaupun dalam konteks ini user.id umumnya stabil)
    fetchProfileData(); 
  }, [user?.id, handleError]); // user?.id sebagai dependensi, dan handleError (yang kini stabil)

  const handleDownloadDocument = async (fileName: string, originalName: string) => {
    try {
      const fileUrl = `/backend/api/documents/download.php?file_name=${encodeURIComponent(fileName)}`;
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      }
  
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Gagal mengunduh file. Terjadi kesalahan jaringan atau server.' }));
        throw new Error(errorData.message || `Gagal mengunduh file: Status ${response.status}`);
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName; 
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      handleSuccess(`Dokumen '${originalName}' berhasil diunduh.`, 'Unduh Berhasil');
    } catch (error: any) {
      handleError(error, 'document_download', { fileName, originalName });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Aktif</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary">Menunggu Verifikasi Email</Badge>;
      case 'pending_document_verification':
        return <Badge variant="outline">Menunggu Dokumen Registrasi</Badge>;
      case 'pending_admin_approval':
        return <Badge className="bg-warning text-warning-foreground">Menunggu Persetujuan Admin</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Dibekukan</Badge>;
      default:
        return <Badge variant="outline">Tidak Diketahui</Badge>;
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Badge variant="secondary">Terunggah</Badge>;
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Terverifikasi</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">Tidak Diketahui</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tidak tersedia';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Tampilan loading (placeholder) saat data sedang dimuat
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-muted rounded animate-pulse" />
            <div className="h-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profil Pengguna</h1>
        <p className="text-muted-foreground">
          Kelola informasi akun dan data pribadi Anda
        </p>
      </div>

      <div className="space-y-6">

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informasi Akun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            {/* Avatar Pengguna */}
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              {/* Menampilkan inisial nama pengguna di avatar */}
              <span className="text-primary-foreground font-bold text-2xl">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {/* Informasi Nama dan Status */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{user?.name}</h2>
              <div className="flex items-center gap-2">
                <span>Status Akun:</span>
                {user?.status && getStatusBadge(user.status)}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Detail Email */}
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{user?.email}</p>
                </div>
              </div>

              {/* Detail Role */}
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{user?.role || 'User'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Detail Tanggal Bergabung */}
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Bergabung Sejak</p>
                  <p className="font-medium">{formatDate(user?.created_at || '')}</p>
                </div>
              </div>

              {/* Detail Nomor Telepon */}
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Telepon</p>
                  <p className="font-medium">{user?.phone || 'Belum diisi'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information Card (jika ada data perusahaan) */}
      {companyData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Informasi Perusahaan
            </CardTitle>
            <CardDescription>Detail data perusahaan yang terdaftar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Nama Perusahaan</p>
                <p className="font-medium">{companyData.company_name}</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">NPWP</p>
                <p className="font-medium">{companyData.npwp}</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">NIB</p>
                <p className="font-medium">{companyData.nib}</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Jenis Usaha</p>
                <p className="font-medium capitalize">{companyData.business_type}</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Status Perusahaan</p>
                {companyData.status && getStatusBadge(companyData.status)}
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Alamat</p>
                <p className="font-medium">{companyData.address}, {companyData.city} {companyData.postal_code}</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Telepon Perusahaan</p>
                <p className="font-medium">{companyData.company_phone}</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Email Perusahaan</p>
                <p className="font-medium break-all">{companyData.company_email}</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Nilai Investasi</p>
                <p className="font-medium">Rp {parseInt(companyData.investment_value).toLocaleString('id-ID')}</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Jumlah Karyawan</p>
                <p className="font-medium">{companyData.employee_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dokumen Anda
          </CardTitle>
          <CardDescription>Daftar dokumen yang telah Anda unggah.</CardDescription>
        </CardHeader>
        <CardContent>
          {userDocuments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Belum ada dokumen yang diunggah.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {userDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{doc.original_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getDocumentStatusBadge(doc.status)}
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    {doc.file_name && ( 
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadDocument(doc.file_name, doc.original_name || 'document.pdf')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Akun</CardTitle>
          <CardDescription>Lakukan perubahan pada akun atau password Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/settings?tab=profile'}>
              <User className="w-4 h-4 mr-2" />
              Edit Profil
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => window.location.href = '/settings?tab=security'}>
              <Shield className="w-4 h-4 mr-2" />
              Ubah Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status Keamanan</CardTitle>
          <CardDescription>Informasi terkait keamanan akun Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span>Email Terverifikasi</span>
              </div>
              <Badge className="bg-success text-success-foreground">
                {user?.email_verified_at ? 'Aktif' : 'Belum Aktif'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                <span>Status Akun</span>
              </div>
              {user?.status && getStatusBadge(user.status)}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                <span>Terakhir Diperbarui</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDate(user?.updated_at || '')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}