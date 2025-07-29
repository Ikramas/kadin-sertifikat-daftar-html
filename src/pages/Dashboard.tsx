// src/pages/Dashboard.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // Import useQuery
import { useErrorHandler } from '@/hooks/useErrorHandler'; // Import useErrorHandler

import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Building2,
  TrendingUp,
  TrendingDown, // Menambahkan TrendingDown
  FileCheck,
  Plus, // Menambahkan Plus
  CreditCard, // Menambahkan CreditCard
  RefreshCw, // Menambahkan RefreshCw
  Award, // Menambahkan Award
  CircleDashed, // Menambahkan CircleDashed
  FolderOpen // Menambahkan FolderOpen
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton untuk loading state

// --- Definisi Tipe Data untuk Statistik Dasbor ---
interface DashboardStats {
  totalApplications: number;
  pendingProcesses: number;
  approved: number;
  activeCertificates: number; // Mengubah activeDocuments menjadi activeCertificates untuk lebih spesifik
  totalUsers?: number;
  lastUpdated?: string; // Menambahkan informasi kapan data terakhir diperbarui
}

// --- FUNGSI PENGAMBILAN DATA DARI BACKEND ---
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
  }

  const response = await fetch('/backend/api/dashboard/stats.php', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Gagal memuat statistik dasbor.' }));
    throw new Error(errorData.message || `Terjadi kesalahan saat mengambil data: Status ${response.status}`);
  }
  const result = await response.json();
  if (result.status === 'success') {
    return {
      ...result.data,
      activeCertificates: result.data.activeDocuments, // Peta dari activeDocuments ke activeCertificates
      lastUpdated: result.data.lastUpdated || new Date().toISOString()
    };
  } else {
    throw new Error(result.message || 'Gagal memuat data statistik.');
  }
};


export default function Dashboard() {
  const { user, isDocumentVerified } = useAuth();
  const { handleError, handleSuccess } = useErrorHandler();

  const { data: stats, isLoading, error, refetch } = useQuery<DashboardStats, Error>({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    enabled: true,
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Tampilan loading skeleton untuk statistik
  const renderStatsSkeleton = () => (
    <>
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
    </>
  );

  // Tampilan untuk pengguna yang belum terverifikasi dokumen
  if (!isDocumentVerified) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Welcome Card with Action Required */}
        {/* FIX: Menyesuaikan desain welcome card untuk non-verified user, menghapus animasi dan merapikan */}
        <Card className="relative overflow-hidden border-l-8 border-primary shadow-lg mb-6">
            <div className="absolute inset-0 bg-primary opacity-90"></div> {/* FIX: Hapus gradient, gunakan warna solid */}
            <CardContent className="p-8 text-primary-foreground relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight">
                            Selamat datang di Portal SBU Kadin Indonesia!
                        </h1>
                        <p className="text-lg opacity-90 max-w-2xl mx-auto md:mx-0">
                            Sentra Layanan Dokumen Elektronik untuk proses Sertifikat Badan Usaha.
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                        <Link to="/document-registration">
                            <Button
                                size="lg"
                                className="bg-white text-primary font-semibold px-8 py-3 rounded-full shadow-md" /* FIX: Menghapus transisi animasi */
                            >
                                <FileCheck className="w-5 h-5 mr-2" />
                                Lengkapi Dokumen Registrasi Anda
                            </Button>
                        </Link>
                         </div>
                    </div>
                    <div className="hidden lg:flex w-40 h-40 bg-white/10 rounded-full items-center justify-center flex-shrink-0"> {/* FIX: Gunakan flex daripada block, hilangkan w-40 */}
                        <Award className="w-24 h-24 text-white opacity-80" />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Status Information & Next Steps */}
        <div className="grid md:grid-cols-2 gap-6 py-8">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning-foreground">
                <AlertCircle className="w-5 h-5" />
                Status Akun Anda
              </CardTitle>
              <CardDescription>Progress verifikasi akun Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Verifikasi Email</span>
                <Badge variant="success" className="font-semibold px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Selesai
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Dokumen Registrasi</span>
                <Badge variant="destructive" className="font-semibold px-3 py-1">
                  <Clock className="w-4 h-4 mr-1" />
                  Belum Lengkap
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Verifikasi Admin</span>
                <Badge variant="outline" className="font-semibold px-3 py-1">
                  <CircleDashed className="w-4 h-4 mr-1 animate-spin" />
                  Menunggu
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <FileText className="w-5 h-5" />
                Langkah Selanjutnya
              </CardTitle>
              <CardDescription>Panduan untuk mengaktifkan semua fitur portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Untuk mulai menggunakan layanan sertifikasi SBU Kadin Indonesia,
                Anda wajib melengkapi dan mengirimkan dokumen registrasi perusahaan Anda.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Dokumen yang diperlukan:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• KTA Kadin Terakhir</li>
                  <li>• NIB (Nomor Induk Berusaha)</li>
                  <li>• Akta Pendirian Perusahaan</li>
                  <li>• NPWP Perusahaan</li>
                  <li>• Dan dokumen lainnya yang tercantum pada halaman registrasi.</li>
                </ul>
              </div>
              <Link to="/guide" className="text-sm text-primary hover:underline flex items-center gap-1">
                Pelajari lebih lanjut di Panduan <TrendingUp className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tampilan dasbor lengkap untuk pengguna yang sudah terverifikasi
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Welcome Section for Verified User */}
      {/* FIX: Menyesuaikan desain welcome card untuk verified user, menghapus animasi dan merapikan */}
      <Card className="relative overflow-hidden border-l-8 border-success shadow-lg mb-6">
          <div className="absolute inset-0 bg-primary opacity-90"></div> {/* FIX: Hapus gradient, gunakan warna solid */}
          <CardContent className="p-8 text-primary-foreground relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 space-y-4 text-center md:text-left">
                      <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight">
                          Selamat datang kembali, {user?.name || 'Pengguna'}!
                      </h1>
                      <p className="text-lg opacity-90 max-w-2xl mx-auto md:mx-0">
                          Siap untuk mengelola sertifikat dan permohonan SBU Anda.
                      </p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                        <Link to="/applications">
                          <Button
                              size="lg"
                              className="bg-white text-primary font-semibold px-8 py-3 rounded-full shadow-md" /* FIX: Menghapus transisi animasi */
                          >
                              <Plus className="w-5 h-5 mr-2" />
                              Ajukan SBU Baru
                          </Button>
                        </Link>
                        <Link to="/transactions">
                          <Button
                              size="lg"
                              variant="outline"
                              className="bg-transparent border-2 border-white text-white font-semibold px-8 py-3 rounded-full shadow-md" /* FIX: Menghapus transisi animasi */
                          >
                              <CreditCard className="w-5 h-5 mr-2" />
                              Lihat Transaksi
                          </Button>
                        </Link>
                      </div>
                  </div>
                  <div className="hidden lg:flex w-40 h-40 bg-white/10 rounded-full items-center justify-center flex-shrink-0"> {/* FIX: Gunakan flex daripada block, hilangkan w-40 */}
                      <Award className="w-24 h-24 text-white opacity-80" />
                  </div>
              </div>
          </CardContent>
      </Card>


      {/* Quick Actions & Statistics */}
       <div className="grid md:grid-cols-2 gap-6 py-8">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-primary">Aksi Cepat</CardTitle>
            <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/applications">
              <Button className="w-full justify-start text-left" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Buat Permohonan SBU Baru
              </Button>
            </Link>
            <Link to="/applications?tab=renewal">
              <Button className="w-full justify-start text-left" variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Ajukan Perpanjangan SBU
              </Button>
            </Link>
            <Link to="/documents"> {/* Mengarahkan ke halaman dokumen registrasi/manajemen dokumen */}
              <Button className="w-full justify-start text-left" variant="outline">
                <FolderOpen className="w-4 h-4 mr-2" />
                Kelola Dokumen Perusahaan
              </Button>
            </Link>
            <Link to="/settings">
              <Button className="w-full justify-start text-left" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Perbarui Profil & Akun
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-primary">Status Statistik</CardTitle>
            <CardDescription>Ringkasan data permohonan dan sertifikat Anda.</CardDescription>
            {error && (
                <p className="text-sm text-destructive mt-2">Gagal memuat statistik. {handleError(error, 'dashboard_stats_fetch').message}</p>
            )}
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading || !stats ? renderStatsSkeleton() : (
              <>
                <div className="flex flex-col items-start space-y-2 p-4 border rounded-md bg-secondary/30">
                  <p className="text-sm text-muted-foreground">Total Permohonan</p>
                  <p className="text-2xl font-bold">{(stats.totalApplications ?? 0).toLocaleString('id-ID')}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>Data Terbaru</span>
                  </div>
                </div>
                <div className="flex flex-col items-start space-y-2 p-4 border rounded-md bg-orange-50/30">
                  <p className="text-sm text-muted-foreground">Sedang Diproses</p>
                  <p className="text-2xl font-bold">{(stats.pendingProcesses ?? 0).toLocaleString('id-ID')}</p>
                  <div className="flex items-center text-xs text-orange-600">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Perlu Tindak Lanjut</span>
                  </div>
                </div>
                <div className="flex flex-col items-start space-y-2 p-4 border rounded-md bg-green-50/30">
                  <p className="text-sm text-muted-foreground">Permohonan Disetujui</p>
                  <p className="text-2xl font-bold">{(stats.approved ?? 0).toLocaleString('id-ID')}</p>
                  <div className="flex items-center text-xs text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span>Berhasil</span>
                  </div>
                </div>
                <div className="flex flex-col items-start space-y-2 p-4 border rounded-md bg-blue-50/30">
                  <p className="text-sm text-muted-foreground">Sertifikat Aktif</p>
                  <p className="text-2xl font-bold">{(stats.activeCertificates ?? 0).toLocaleString('id-ID')}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Award className="h-3 w-3 mr-1" />
                    <span>Siap Digunakan</span>
                  </div>
                </div>
              </>
            )}
            <div className="col-span-1 md:col-span-2 text-right text-xs text-muted-foreground pt-2">
                Data diperbarui: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString('id-ID') : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Verifikasi Akun & Perusahaan */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-primary">Status Verifikasi</CardTitle>
          <CardDescription>Status terkini verifikasi akun dan dokumen perusahaan Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3 p-3 bg-green-50/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
              <div>
                <p className="font-medium">Email Terverifikasi</p>
                <p className="text-sm text-muted-foreground">Akun Anda sudah aktif.</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
              <div>
                <p className="font-medium">Dokumen Disetujui</p>
                <p className="text-sm text-muted-foreground">Semua fitur portal tersedia.</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-primary-50/30 rounded-lg">
              <FileCheck className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium">Siap Mengajukan SBU</p>
                <p className="text-sm text-muted-foreground">Anda dapat memulai permohonan sertifikasi.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}