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

  // Tampilkan pesan error jika pengguna tidak terautentikasi
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (!location.state?.fromLogout && !location.state?.fromInactivity) {
        handleError(
          new Error('Anda perlu login untuk mengakses halaman ini. Sesi Anda mungkin telah berakhir.'),
          'unauthenticated_access',
          { path: location.pathname }
        );
      }
    }
  }, [isLoading, isAuthenticated, handleError, location.pathname, location.state]);

  // Tampilkan pesan error jika dokumen belum diverifikasi ketika diperlukan
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      requireDocumentVerification &&
      !isDocumentVerified
    ) {
      handleError(
        new Error('Untuk mengakses halaman ini, dokumen perusahaan Anda perlu diverifikasi dan disetujui admin.'),
        'document_verification_required',
        { path: location.pathname, userStatus: user?.status }
      );
    }
  }, [
    isLoading,
    isAuthenticated,
    requireDocumentVerification,
    isDocumentVerified,
    handleError,
    location.pathname,
    user?.status,
  ]);

  // KRUSIAL: Jika sedang memuat status autentikasi, JANGAN lakukan redirect atau render apa pun.
  // Ini mencegah flickering dan redirect prematur yang dapat memicu loop.
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, fromProtectedRoute: true }}
      />
    );
  }

  if (requireDocumentVerification && !isDocumentVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  // Jika semua pemeriksaan berhasil, render children (komponen halaman yang dilindungi).
  return <>{children}</>;
};