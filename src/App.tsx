import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Import semua halaman yang ada di proyek
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import Dashboard from "./pages/Dashboard";
import DocumentRegistration from "./pages/DocumentRegistration";
import Applications from "./pages/Applications";
import Certificates from "./pages/Certificates";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import Company from "./pages/Company";
import Settings from "./pages/Settings";
import Guide from "./pages/Guide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* AppLayout akan menjadi wrapper untuk semua halaman */}
            <Route path="/" element={<AppLayout />}>
              
              {/* Rute default, akan diarahkan oleh ProtectedRoute */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Rute Publik (Tidak perlu login) */}
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="verify-otp" element={<VerifyOTP />} />
              
              {/* Rute Terproteksi (Hanya bisa diakses setelah login) */}
              <Route 
                path="dashboard" 
                element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
              />
              <Route 
                path="document-registration" 
                element={<ProtectedRoute><DocumentRegistration /></ProtectedRoute>} 
              />
              <Route 
                path="profile" 
                element={<ProtectedRoute><Profile /></ProtectedRoute>} 
              />
              <Route 
                path="guide" 
                element={<ProtectedRoute><Guide /></ProtectedRoute>} 
              />
              <Route 
                path="settings" 
                element={<ProtectedRoute><Settings /></ProtectedRoute>} 
              />
              
              {/* Rute Terproteksi yang Memerlukan Verifikasi Dokumen */}
              <Route 
                path="company" 
                element={<ProtectedRoute requireDocumentVerification={true}><Company /></ProtectedRoute>} 
              />
              <Route 
                path="applications" 
                element={<ProtectedRoute requireDocumentVerification={true}><Applications /></ProtectedRoute>} 
              />
              <Route 
                path="certificates" 
                element={<ProtectedRoute requireDocumentVerification={true}><Certificates /></ProtectedRoute>} 
              />
              <Route 
                path="transactions" 
                element={<ProtectedRoute requireDocumentVerification={true}><Transactions /></ProtectedRoute>} 
              />
              
              {/* Halaman Tidak Ditemukan (Catch-all) */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
