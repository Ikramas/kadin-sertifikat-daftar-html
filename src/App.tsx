// src/App.tsx
// Ini adalah komponen root utama aplikasi React Anda,
// yang mengatur routing, penyedia konteks global, dan struktur layout dasar.

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom"; 
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { toast } from '@/hooks/use-toast';
import { ErrorHandler } from '@/utils/errorHandler';
// ErrorBoundary tidak perlu diimpor di sini karena sudah di main.tsx

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
import ApplicationDetail from "./pages/ApplicationDetail";
import Analytics from "./pages/Analytics";

// Membuat instance QueryCache kustom dengan penanganan onError global
const customQueryCache = new QueryCache({
  onError: (error: Error, query) => {
    console.error("Global Query Error Caught by Custom QueryCache:", error, query);
    
    const readableMessage = ErrorHandler.getReadableErrorMessage(error);
    const severity = ErrorHandler.getErrorSeverity(error);

    toast({
      title: ErrorHandler.getErrorTitle(severity),
      description: readableMessage,
      variant: severity === 'critical' || severity === 'high' ? 'destructive' : 
               severity === 'medium' ? 'warning' : 'default',
      duration: 7000, 
    });
  },
});

// Inisialisasi QueryClient untuk React Query
const queryClient = new QueryClient({
  queryCache: customQueryCache,
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

const App = () => (
  // Urutan provider krusial: React Query dulu karena dipakai banyak hook,
  // lalu Tooltip, lalu Auth (karena mengatur loading/autentikasi global),
  // lalu Toaster (agar bisa menampilkan pesan dari semua provider di atasnya)
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster /> 
        {/* Routes sekarang langsung berada di sini, di dalam BrowserRouter yang ada di main.tsx */}
        <Routes>
          <Route path="/" element={<AppLayout />}>

            <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Rute Publik */}
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify-otp" element={<VerifyOTP />} />

            {/* Rute Terproteksi */}
            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="document-registration" element={<ProtectedRoute><DocumentRegistration /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="guide" element={<ProtectedRoute><Guide /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

            {/* Rute Terproteksi yang Memerlukan Verifikasi Dokumen */}
            <Route path="company" element={<ProtectedRoute requireDocumentVerification={true}><Company /></ProtectedRoute>} />
            <Route path="applications" element={<ProtectedRoute requireDocumentVerification={true}><Applications /></ProtectedRoute>} />
            <Route path="applications/:code_reg" element={<ProtectedRoute requireDocumentVerification={true}><ApplicationDetail /></ProtectedRoute>} />
            <Route path="certificates" element={<ProtectedRoute requireDocumentVerification={true}><Certificates /></ProtectedRoute>} />
            <Route path="transactions" element={<ProtectedRoute requireDocumentVerification={true}><Transactions /></ProtectedRoute>} />

            {/* Halaman Tidak Ditemukan */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;