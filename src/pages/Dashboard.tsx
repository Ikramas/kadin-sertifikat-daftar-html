import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // Import useQuery

import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Building2,
  TrendingUp,
  FileCheck
} from 'lucide-react';

// --- Definisi Tipe Data untuk Statistik Dasbor ---
interface DashboardStats {
  totalApplications: number;
  pendingProcesses: number;
  approved: number;
  activeDocuments: number;
}

// --- FUNGSI PENGAMBILAN DATA DARI BACKEND (PERLU DISESUAIKAN) ---
// Ini adalah fungsi async yang akan mengambil data dari API backend Anda.
// Anda harus mengganti bagian 'return new Promise' dengan panggilan 'fetch' yang sebenarnya.
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  // Contoh implementasi nyata dengan panggilan fetch ke backend:
  // const token = localStorage.getItem('authToken'); // Asumsi token disimpan di localStorage
  // const response = await fetch('/backend/api/dashboard/stats.php', {
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${token}` // Sertakan token otentikasi jika diperlukan
  //   }
  // });

  // if (!response.ok) {
  //   // Tangani error, misalnya throw new Error atau return default value
  //   throw new Error('Gagal mengambil statistik dasbor');
  // }
  // return response.json(); // Mengembalikan data JSON dari respons API

  // --- PLACEHOLDER / DATA DUMMY (HAPUS INI SETELAH INTEGRASI API) ---
  // Untuk tujuan demonstrasi agar kode dapat berjalan dan menunjukkan fungsionalitas loading:
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalApplications: Math.floor(Math.random() * 100) + 10, // Contoh data acak
        pendingProcesses: Math.floor(Math.random() * 15) + 5,
        approved: Math.floor(Math.random() * 70) + 20,
        activeDocuments: Math.floor(Math.random() * 30) + 10,
      });
    }, 1000); // Simulasi penundaan jaringan 1 detik
  });
  // --- AKHIR DARI PLACEHOLDER ---
};


export default function Dashboard() {
  const { user, isDocumentVerified } = useAuth();

  // Menggunakan useQuery untuk mengelola pengambilan, caching, dan pembaruan data statistik
  const { data: stats, isLoading, error } = useQuery<DashboardStats, Error>({
    queryKey: ['dashboardStats'], // Kunci unik untuk query ini
    queryFn: fetchDashboardStats,  // Fungsi yang akan mengambil data
    // Konfigurasi untuk manajemen caching dan real-time:
    staleTime: 1000 * 60 * 5,    // Data dianggap 'stale' setelah 5 menit. Setelah ini, data akan di-refetch di latar belakang saat query diakses.
    refetchInterval: 1000 * 30, // Refetch data secara otomatis setiap 30 detik. Sesuaikan sesuai kebutuhan real-time Anda.
    refetchOnWindowFocus: true, // Data akan di-refetch saat jendela kembali fokus.
    refetchOnMount: true,       // Data akan di-refetch saat komponen dipasang.
  });

  // Tampilan untuk pengguna yang belum terverifikasi dokumen
  if (!isDocumentVerified) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Welcome Card with Action Required */}
        <Card className="border-l-4 border-l-warning bg-gradient-primary text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Selamat datang di TRADE Certificate of Origin.
                  </h1>
                  <p className="text-lg opacity-90">
                    Sentra Layanan Dokumen Elektronik untuk pembuatan Surat Keterangan Asal barang
                  </p>
                </div>
                <Link to="/document-registration">
                  <Button
                    size="lg"
                    className="bg-success hover:bg-success/90 text-success-foreground font-semibold px-8"
                  >
                    Document Registration
                  </Button>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                  <FileCheck className="w-16 h-16 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Information */}
        <div className="grid md:grid-cols-2 gap-6 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                Status Akun Anda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Verifikasi Email</span>
                <Badge variant="secondary" className="bg-success text-success-foreground">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Selesai
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Dokumen Registrasi</span>
                <Badge variant="destructive">
                  <Clock className="w-4 h-4 mr-1" />
                  Belum Lengkap
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Verifikasi Admin</span>
                <Badge variant="outline">
                  <Clock className="w-4 h-4 mr-1" />
                  Menunggu
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Langkah Selanjutnya
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Untuk mulai menggunakan layanan sertifikasi SBU Kadin Indonesia,
                  Anda wajib melengkapi dokumen registrasi perusahaan.
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium">Dokumen yang diperlukan:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• KTA Kadin Terakhir</li>
                    <li>• NIB (Nomor Induk Berusaha)</li>
                    <li>• Akta Pendirian Perusahaan</li>
                    <li>• NPWP Perusahaan</li>
                    <li>• Dan dokumen lainnya</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tampilan dasbor lengkap untuk pengguna yang sudah terverifikasi
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Welcome Section */}
      <Card className="border-l-4 border-l-warning bg-gradient-primary text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Selamat datang, {user?.name}!
              </h1>
              <p className="text-lg opacity-90">
                Portal SBU Kadin Indonesia - Dashboard Lengkap
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
                <Building2 className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
       <div className="grid md:grid-cols-2 gap-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/applications/new">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Permohonan SBU Baru
              </Button>
            </Link>
            <Link to="/applications/renewal">
              <Button className="w-full justify-start" variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Perpanjangan SBU
              </Button>
            </Link>
            <Link to="/documents">
              <Button className="w-full justify-start" variant="outline">
                <FileCheck className="w-4 h-4 mr-2" />
                Kelola Dokumen
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Belum ada aktivitas</p>
                <p className="text-sm text-muted-foreground">
                  Mulai dengan membuat permohonan SBU pertama Anda
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Status Verifikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-success" />
              <div>
                <p className="font-medium">Email Terverifikasi</p>
                <p className="text-sm text-muted-foreground">Akun Anda sudah aktif</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-success" />
              <div>
                <p className="font-medium">Dokumen Disetujui</p>
                <p className="text-sm text-muted-foreground">Semua fitur tersedia</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FileCheck className="w-6 h-6 text-primary" />
              <div>
                <p className="font-medium">Siap Mengajukan SBU</p>
                <p className="text-sm text-muted-foreground">Mulai permohonan Anda</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}