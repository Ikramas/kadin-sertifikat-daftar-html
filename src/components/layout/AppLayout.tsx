import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AppLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Daftar halaman publik yang tidak menggunakan layout dashboard
  const publicPages = ['/login', '/register', '/verify-otp'];
  const isPublicPage = publicPages.includes(location.pathname);

  // Tampilkan loading screen jika status auth belum jelas
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Jika user sudah login TAPI mencoba akses halaman publik, arahkan ke dashboard
  if (isAuthenticated && isPublicPage) {
    // Arahkan ke dashboard jika sudah login tapi mencoba akses halaman login/register
    // (Ini memerlukan komponen Navigate dari react-router-dom, tapi untuk sekarang kita handle di level route App.tsx)
    // Untuk sementara, kita bisa tampilkan layout dashboard saja.
  }

  // Jika user BELUM login dan ini BUKAN halaman publik, ini akan dihandle oleh ProtectedRoute
  // Jika user BELUM login dan ini ADALAH halaman publik, tampilkan tanpa layout
  if (!isAuthenticated && isPublicPage) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  // Jika user sudah login dan ini BUKAN halaman publik, tampilkan layout dashboard
  if (isAuthenticated && !isPublicPage) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar Desktop */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <Sidebar />
        </div>

        {/* Konten Utama */}
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex-shrink-0">
            {/* Header Mobile */}
            <div className="lg:hidden bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="text-primary-foreground hover:bg-primary-light">
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-foreground rounded-lg flex items-center justify-center"><span className="text-primary font-bold text-sm">KI</span></div>
                <span className="font-bold text-sm">KADIN INDONESIA</span>
              </div>
              <div className="w-8" />
            </div>
            {/* Header Desktop */}
            <div className="hidden lg:block">
              <Header />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <Outlet />
          </main>
        </div>

        {/* Sidebar Mobile (Overlay) */}
        <div className={cn("fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity", sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={() => setSidebarOpen(false)} />
        <div className={cn('fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out lg:hidden', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>
    );
  }

  // Fallback untuk kasus lain (misalnya user belum login dan mencoba akses halaman terproteksi)
  // Ini akan ditangani oleh ProtectedRoute, tapi sebagai jaring pengaman:
  return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
  );
};