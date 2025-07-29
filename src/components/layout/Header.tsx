// src/components/layout/Header.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler'; // Import useErrorHandler
import { useLocation } from 'react-router-dom'; // Import useLocation untuk mendapatkan pathname

export const Header = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler(); // Inisialisasi useErrorHandler
  const location = useLocation(); // Dapatkan objek lokasi saat ini

  // Fungsi untuk mendapatkan judul dinamis berdasarkan pathname
  const getDynamicTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/profile':
        return 'Profil Pengguna';
      case '/document-registration':
        return 'Registrasi Dokumen Perusahaan';
      case '/company':
        return 'Data Perusahaan';
      case '/applications':
        return 'Daftar Permohonan SBU';
      case '/certificates':
        return 'Daftar Sertifikat SBU';
      case '/transactions':
        return 'Riwayat Transaksi';
      case '/guide':
        return 'Panduan Penggunaan';
      case '/settings':
        return 'Pengaturan Akun';
      case '/analytics':
        return 'Dashboard Analitik';
      default:
        // Menangani rute dinamis seperti /applications/:code_reg
        if (location.pathname.startsWith('/applications/')) {
          return 'Detail Permohonan SBU';
        }
        return 'Portal Kadin SBU'; // Judul default
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{getDynamicTitle()}</h1> {/* Menggunakan judul dinamis */}
          <p className="text-muted-foreground">Selamat datang di Portal SBU Kadin Indonesia</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.name || 'Pengguna'}</p> {/* Fallback jika nama tidak ada */}
            <p className="text-xs text-muted-foreground">{user?.email || 'Tidak Diketahui'}</p> {/* Fallback jika email tidak ada */}
          </div>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'P'} {/* Fallback inisial */}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};