// src/components/layout/AppLayout.tsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"; // Pastikan Toaster diimport
import { useErrorHandler } from '@/hooks/useErrorHandler'; // FIX: Import useErrorHandler

export const AppLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { handleError } = useErrorHandler(); // FIX: Inisialisasi useErrorHandler

  // Daftar halaman publik yang tidak menggunakan layout dashboard
  const publicPages = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password']; // FIX: Tambahkan halaman publik lain jika ada
  const isPublicPage = publicPages.includes(location.pathname);

  // KRUSIAL: Tampilkan loading screen jika status auth belum jelas.
  // Ini mencegah rendering layout yang salah atau flickering sebelum AuthContext siap.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {/* Simple spinner atau skeleton loader */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Memuat aplikasi, mohon tunggu sebentar...</p>
        </div>
        {/* Toaster di sini untuk menangani potensi error selama loading */}
        <Toaster />
      </div>
    );
  }

  // Jika user sudah login TAPI mencoba akses halaman publik,
  // biarkan Router dan ProtectedRoute yang menangani pengalihan ke halaman terproteksi.
  // AppLayout hanya bertanggung jawab untuk menampilkan konten tanpa layout dashboard.
  if (isAuthenticated && isPublicPage) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster /> {/* Toaster perlu ada di sini juga untuk halaman publik */}
        <Outlet />
      </div>
    );
  }

  // Jika user BELUM login dan ini ADALAH halaman publik (login/register/otp),
  // tampilkan konten tanpa layout dashboard.
  if (!isAuthenticated && isPublicPage) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster /> {/* Toaster perlu ada di sini juga untuk halaman publik */}
        <Outlet />
      </div>
    );
  }

  // Jika user sudah login DAN ini BUKAN halaman publik, tampilkan layout dashboard.
  // Ini adalah skenario utama untuk halaman-halaman terproteksi.
  if (isAuthenticated && !isPublicPage) {
    return (
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar Desktop */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <Sidebar />
        </div>

        {/* Konten Utama */}
        {/* FIX: Memastikan konten utama bisa di-scroll dan memiliki z-index yang wajar */}
        <div className="flex flex-1 flex-col min-w-0 relative z-10">
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
        {/* FIX: Memastikan overlay memiliki z-index yang tepat dan pointer-events dikelola secara dinamis */}
        <div
          className={cn(
            "fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300",
            sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none" // Sangat KRUSIAL untuk navigasi
          )}
          onClick={() => setSidebarOpen(false)}
        />
        {/* FIX: Memastikan sidebar mobile memiliki z-index lebih tinggi dari overlay */}
        <div
          className={cn(
            'fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out lg:hidden',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
        <Toaster /> {/* Toaster perlu ada di sini untuk halaman terproteksi */}
      </div>
    );
  }

  // Fallback untuk kasus lain (misalnya user belum login dan mencoba akses halaman terproteksi).
  // Ini akan ditangani oleh ProtectedRoute di level Route, mengalihkan ke login.
  return (
      <div className="min-h-screen bg-background">
        <Toaster /> {/* Toaster perlu ada di sini untuk fallback juga */}
        <Outlet />
      </div>
  );
};