import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireDocumentVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireDocumentVerification = false 
}) => {
  const { isAuthenticated, isDocumentVerified } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireDocumentVerification && !isDocumentVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};