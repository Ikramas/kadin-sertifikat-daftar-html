import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  User,
  Building2,
  FolderOpen,
  CreditCard,
  BookOpen,
  Settings,
  LogOut,
  X,
  Award // Menambahkan ikon Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requireVerification?: boolean;
}

// Daftar menu lengkap
const menuItems: MenuItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Profil Pengguna', path: '/profile', icon: User },
  { name: 'Dokumen Registrasi', path: '/document-registration', icon: FileText },
  { name: 'Data Perusahaan', path: '/company', icon: Building2, requireVerification: true },
  { name: 'Permohonan SBU', path: '/applications', icon: FolderOpen, requireVerification: true },
  { name: 'Sertifikat', path: '/certificates', icon: Award, requireVerification: true }, // Menggunakan ikon Award
  { name: 'Transaksi', path: '/transactions', icon: CreditCard, requireVerification: true },
  { name: 'Panduan', path: '/guide', icon: BookOpen },
  { name: 'Pengaturan', path: '/settings', icon: Settings, requireVerification: true },
];

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const { user, isDocumentVerified, logout } = useAuth();
  const location = useLocation();

  // Filter menu berdasarkan status verifikasi dokumen
  const filteredMenuItems = menuItems.filter(item => {
    // Sembunyikan 'Dokumen Registrasi' jika sudah terverifikasi
    if (item.path === '/document-registration' && isDocumentVerified) {
        return false;
    }
    // Sembunyikan item yang memerlukan verifikasi jika pengguna belum terverifikasi dokumen
    if (item.requireVerification && !isDocumentVerified) {
      return false;
    }
    return true;
  });

  const handleLinkClick = () => {
    // Panggil onClose jika ada (untuk sidebar mobile)
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="w-sidebar bg-primary text-primary-foreground flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 border-b border-primary-light flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-foreground rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-lg">KI</span>
            </div>
            <div>
                <h2 className="font-bold text-md">KADIN INDONESIA</h2>
                <p className="text-xs opacity-80">Portal SBU</p>
            </div>
        </div>
        {/* Tombol Close untuk Mobile */}
        {onClose && (
            <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-primary-foreground hover:bg-primary-light lg:hidden"
            >
                <X className="w-5 h-5" />
            </Button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {filteredMenuItems.map((item) => {
            // Tentukan apakah item menu aktif berdasarkan pathname saat ini
            // Menggunakan location.pathname === item.path untuk highlight exact match
            // Jika ingin highlight parent route (misal /applications/detail, highlight /applications), gunakan startsWith
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors hover:bg-primary-light',
                    isActive && 'bg-primary-light'
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="flex-grow">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-primary-light p-4 mt-auto">
        <div className="text-sm mb-3">
          <p className="font-medium truncate">{user?.name}</p>
          <p className="text-xs opacity-70 truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => logout()} // Pastikan logout dipanggil sebagai fungsi
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-light rounded-md transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};