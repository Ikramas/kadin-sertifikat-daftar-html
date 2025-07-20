import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Building2, Calendar, Shield, MapPin, CreditCard, FileText, ExternalLink, Download } from 'lucide-react'; // Menambahkan FileText, ExternalLink, Download

// Mengimpor interface User dari file types yang sesuai
import type { User as UserData } from '@/types/user';
// Mengimpor interface Company dari file types yang sesuai
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
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [userDocuments, setUserDocuments] = useState<DocumentData[]>([]); // State untuk dokumen
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile data including company data and documents
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
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
          if (data.data.documents) { // Memeriksa apakah data.documents ada
            setUserDocuments(data.data.documents);
          }
        } else {
          toast({
            title: 'Gagal memuat profil',
            description: data.message || 'Terjadi kesalahan saat memuat data profil.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error Jaringan',
          description: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

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

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informasi Akun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
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
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{user?.role || 'User'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Bergabung Sejak</p>
                  <p className="font-medium">{formatDate(user?.created_at || '')}</p>
                </div>
              </div>

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

    

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Link ini dapat diarahkan ke tab "Profil & Akun" di halaman Settings.tsx */}
            <Button variant="outline" className="justify-start">
              <User className="w-4 h-4 mr-2" />
              Edit Profil
            </Button>
            {/* Link ini dapat diarahkan ke tab "Keamanan" (untuk ubah password) di halaman Settings.tsx */}
            <Button variant="outline" className="justify-start">
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