// src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireDocumentVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireDocumentVerification = false
}) => {
  const { isAuthenticated, isDocumentVerified, isLoading } = useAuth();
  const location = useLocation();

  // KRUSIAL: Jika sedang memuat (misalnya setelah refresh), JANGAN lakukan redirect.
  // Render null (atau komponen loading spinner) untuk mencegah pengalihan prematur.
  if (isLoading) {
    return null; 
  }

  // Jika belum terautentikasi (setelah loading selesai), arahkan ke halaman login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Jika memerlukan verifikasi dokumen DAN dokumen belum diverifikasi, arahkan ke dashboard.
  // Kondisi ini hanya dievaluasi setelah isLoading selesai.
  if (requireDocumentVerification && !isDocumentVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  // Jika semua pemeriksaan berhasil dan aman, tampilkan konten halaman yang diminta.
  return <>{children}</>;
};