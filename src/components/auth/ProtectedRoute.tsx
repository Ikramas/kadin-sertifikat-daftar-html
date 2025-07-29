// src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler'; 
import React, { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireDocumentVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireDocumentVerification = false
}) => {
  const { isAuthenticated, isDocumentVerified, isLoading, user } = useAuth();
  const { handleError } = useErrorHandler();
  const location = useLocation();

  // KRUSIAL: Jika sedang memuat status autentikasi, JANGAN lakukan redirect atau render apa pun.
  // Ini mencegah flickering dan redirect prematur yang dapat memicu loop.
  if (isLoading) {
    // console.log("ProtectedRoute: Loading authentication status, returning null.");
    return null; 
  }

  // Jika setelah loading selesai, ternyata tidak terautentikasi, arahkan ke halaman login.
  if (!isAuthenticated) {
    // Memberikan pesan error yang jelas jika pengguna mencoba akses halaman tanpa login
    useEffect(() => {
        // Hanya tampilkan pesan error jika pengguna tidak dialihkan dari logout/inaktivitas yang disengaja
        if (!location.state?.fromLogout && !location.state?.fromInactivity) {
            handleError(new Error('Anda perlu login untuk mengakses halaman ini. Sesi Anda mungkin telah berakhir.'), 'unauthenticated_access', { path: location.pathname });
        }
    }, [handleError, location.pathname, location.state]); 
    
    // Redirect ke halaman login. `replace` akan mengganti entri di riwayat browser.
    // `state` digunakan untuk memberi tahu halaman login/AuthContext asal redirect ini.
    return <Navigate to="/login" replace state={{ from: location.pathname, fromProtectedRoute: true }} />;
  }

  // Jika memerlukan verifikasi dokumen DAN dokumen belum diverifikasi, arahkan ke dashboard.
  if (requireDocumentVerification && !isDocumentVerified) {
    useEffect(() => {
        handleError(new Error('Untuk mengakses halaman ini, dokumen perusahaan Anda perlu diverifikasi dan disetujui admin.'), 'document_verification_required', { path: location.pathname, userStatus: user?.status });
    }, [handleError, location.pathname, user?.status]);
    return <Navigate to="/dashboard" replace />;
  }

  // Jika semua pemeriksaan berhasil, render children (komponen halaman yang dilindungi).
  return <>{children}</>;
};