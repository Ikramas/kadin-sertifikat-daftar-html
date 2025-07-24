// File: src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, UserRegistrationData } from '@/types/user';
import type { Company, Document } from '@/types/company';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isDocumentVerified: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: (redirect?: boolean) => Promise<void>; // Parameter redirect opsional
  register: (userData: UserRegistrationData) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
  resendOTP: (email: string) => Promise<{ waitTime: number; message: string }>;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDocumentVerified, setIsDocumentVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Default ke true saat aplikasi dimulai untuk fetch awal

  const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 jam dalam milidetik
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fungsi internal untuk membersihkan state AuthContext
  const clearAuthStates = useCallback(() => {
    setUser(null);
    setCompany(null);
    setIsAuthenticated(false);
    setIsDocumentVerified(false); // Pastikan ini juga direset
    (window as any).AUTH_CONTEXT_DEBUG_USER_DOCUMENTS = null; // Membersihkan debug info

    // Pastikan timer inaktivitas juga dihentikan saat state dibersihkan
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []); // Dependensi kosong karena tidak bergantung pada state/props lain

  // Fungsi logout utama
  const logout = useCallback(async (redirect: boolean = true) => {
    console.log("Melakukan logout...");
    const token = localStorage.getItem('token');
    
    // Clear state autentikasi lokal sebelum menghapus token dari local storage
    clearAuthStates();
    
    // Kirim beacon ke backend untuk denylist token (dilakukan jika ada token)
    // SendBeacon lebih reliable untuk logout saat halaman akan ditutup/di-unload
    if (token) {
      try {
        navigator.sendBeacon('/backend/api/auth/logout.php', JSON.stringify({ token }));
        console.log("SendBeacon logout dikirim.");
      } catch (error) {
        console.error('Logout request (sendBeacon) failed:', error);
      }
    }
    
    // Hapus token dari localStorage. Ini adalah bagian krusial.
    // Selalu hapus token di sini, karena fungsi ini dipanggil untuk logout *final*.
    localStorage.removeItem('token'); 

    // Redirect hanya jika diinstruksikan. Penting untuk tidak redirect saat browser ditutup paksa.
    if (redirect) {
        window.location.href = '/login'; // Memaksa refresh dan redirect
    }
  }, [clearAuthStates]); // clearAuthStates adalah dependensi

  // Fungsi untuk mereset timer tidak aktif
  const resetInactivityTimer = useCallback(() => {
    // Bersihkan timer yang ada jika ada
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set timer baru hanya jika pengguna terautentikasi
    if (isAuthenticated) { 
      inactivityTimerRef.current = setTimeout(() => {
        console.log("Logout karena inaktivitas.");
        logout(true); // Logout otomatis karena inaktivitas, redirect ke login
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, logout, INACTIVITY_TIMEOUT]); // Dependensi: isAuthenticated, logout, INACTIVITY_TIMEOUT

  // Fungsi untuk mengambil profil pengguna (dipanggil saat init, login, atau refresh)
  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true); // Mulai loading saat fetch dimulai
    const token = localStorage.getItem('token');

    if (!token) {
      clearAuthStates(); // Pastikan state bersih jika tidak ada token
      setIsLoading(false); // Selesai loading, karena tidak ada token untuk diambil
      return;
    }

    try {
      const response = await fetch('/backend/api/users/profile.php', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
          // Token tidak valid atau kadaluarsa. Panggil logout tanpa redirect segera.
          // ProtectedRoute akan mendeteksi !isAuthenticated dan mengalihkan ke /login.
          console.log("Token tidak valid atau kadaluarsa. Memicu logout non-redirect.");
          await logout(false); // Panggil logout tanpa paksa redirect dari sini
          return; // Penting untuk return agar tidak melanjutkan ke blok try/catch yang salah
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Terjadi kesalahan tidak dikenal.' }));
        throw new Error(errorData.message || 'Gagal memuat profil pengguna');
      }

      const data = await response.json();
      if (data.status === 'success') {
        const fetchedUser: User = { ...data.data.user, documents: data.data.documents || [] };
        const fetchedCompany: Company | null = data.data.company || null;

        setUser(fetchedUser);
        setCompany(fetchedCompany);
        setIsAuthenticated(true);
        
        // --- KRUSIAL: HITUNG isDocumentVerified DI SINI, SETELAH user DAN company DISET ---
        // Ini memastikan isDocumentVerified diatur sebelum isLoading menjadi false.
        const isVerified = (fetchedUser.status === 'active' || fetchedUser.status === 'verified') && 
                           (fetchedCompany && fetchedCompany.status === 'verified');
        setIsDocumentVerified(isVerified);
        // ----------------------------------------------------------------------------------

        resetInactivityTimer(); // Reset timer setelah aktivitas berhasil (fetch profil)

        (window as any).AUTH_CONTEXT_DEBUG_USER_DOCUMENTS = data.data.documents;
        console.log("DEBUG: Dokumen dari AuthContext:", (window as any).AUTH_CONTEXT_DEBUG_USER_DOCUMENTS);

      } else {
        throw new Error(data.message || 'Gagal memuat data profil');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      clearAuthStates(); // Bersihkan state lokal karena ada error
      localStorage.removeItem('token'); // Hapus token yang mungkin rusak/invalid
    } finally {
      setIsLoading(false); // Selesai loading, terlepas dari berhasil atau gagal
    }
  }, [logout, clearAuthStates, resetInactivityTimer]); // Dependensi: logout, clearAuthStates, resetInactivityTimer

  // Efek pertama kali saat komponen dimuat untuk mengambil profil
  useEffect(() => {
    // Jalankan fetchUserProfile hanya sekali saat komponen pertama kali di-mount
    // Status isLoading di AuthProvider akan menangani penundaan render UI
    fetchUserProfile();
  }, [fetchUserProfile]); // Dependensi pada fetchUserProfile (useCallback)

  // Efek untuk mengelola event aktivitas pengguna (mouse, keyboard, scroll)
  useEffect(() => {
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Mulai/reset timer saat komponen di-mount atau saat authenticated berubah
    if (isAuthenticated) {
        resetInactivityTimer();
    }

    return () => {
      // Cleanup: hapus timer dan event listener saat komponen di-unmount
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [isAuthenticated, resetInactivityTimer]); // Dependensi: isAuthenticated, resetInactivityTimer

  // Efek untuk menangani refresh (sebagai 'isReloading') dan penutupan tab/browser
  // Ini adalah logika yang paling krusial untuk membedakan refresh dari close
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Set flag di sessionStorage untuk menandakan ini adalah reload/refresh
      // Ini akan dibaca oleh handleUnload
      sessionStorage.setItem('isReloading', 'true');
    };

    const handleUnload = () => {
      // Logic di sini dijalankan sesaat sebelum halaman dibongkar.
      // Jika 'isReloading' TIDAK ADA, berarti ini penutupan tab/browser yang sebenarnya.
      // Maka token HARUS dihapus.
      if (sessionStorage.getItem('isReloading') !== 'true') {
        console.log("Tab/browser ditutup, menghapus token dari localStorage.");
        localStorage.removeItem('token');
        // Tidak perlu panggil `logout(false)` di sini karena `sendBeacon` sudah dipanggil
        // di fungsi logout jika ada token. Ini untuk memastikan penghapusan lokal saja.
      } else {
        // Ini adalah refresh, flag 'isReloading' akan ada.
        // Token di localStorage dipertahankan agar fetchUserProfile bisa membacanya lagi.
        console.log("Halaman di-refresh, mempertahankan token di localStorage.");
      }
      // Hapus flag setelah setiap unload untuk mereset kondisi
      sessionStorage.removeItem('isReloading');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, []); // Dependensi kosong karena fungsi ini hanya berinteraksi dengan DOM API dan sessionStorage

  const login = async (email: string, password: string) => {
    const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
    const csrfData = await csrfResponse.json();
    if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
        throw new Error('Gagal mendapatkan token keamanan.');
    }
    const csrfToken = csrfData.data.csrf_token;

    const response = await fetch('/backend/api/auth/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ email, password, csrf_token: csrfToken }),
    });

    const data = await response.json();

    if (data.status === 'success' && data.data.token) {
      localStorage.setItem('token', data.data.token);
      await fetchUserProfile(); // Setelah login, langsung fetch profil
    } else {
      throw new Error(data.message || 'Login gagal. Periksa kembali kredensial Anda.');
    }
  };


  const register = async (userData: UserRegistrationData) => {
    const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
    const csrfData = await csrfResponse.json();
    if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
      throw new Error('Gagal mendapatkan token keamanan.');
    }
    const csrfToken = csrfData.data.csrf_token;

    const response = await fetch('/backend/api/auth/register.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ ...userData, csrf_token: csrfToken }),
    });

    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(data.message || 'Registrasi gagal.');
    }
    return data;
  };

  const verifyOTP = async (email: string, otp: string) => {
    const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
    const csrfData = await csrfResponse.json();
    if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
      throw new Error('Gagal mendapatkan token keamanan.');
    }
    const csrfToken = csrfData.data.csrf_token;
      
    const response = await fetch('/backend/api/auth/verify-otp.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ email, otp, csrf_token: csrfToken }),
    });

    const data = await response.json();
    if (data.status === 'success') {
      await fetchUserProfile();
    } else {
      throw new Error(data.message || 'Verifikasi OTP gagal.');
    }
    return data;
  };

  const resendOTP = async (email: string) => {
    const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
    const csrfData = await csrfResponse.json();
    if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
      throw new Error('Gagal mendapatkan token keamanan.');
    }
    const csrfToken = csrfData.data.csrf_token;

    const response = await fetch('/backend/api/auth/resend-otp.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ email, csrf_token: csrfToken }),
    });

    const data = await response.json();
    if (data.status === 'success') {
      return {
        waitTime: data.data.wait_time || data.data.cooldown_seconds || 30,
        message: data.message,
      };
    } else {
      throw new Error(data.message || 'Gagal mengirim ulang OTP.');
    }
  };

  const value = {
    user,
    company,
    isAuthenticated,
    isDocumentVerified,
    isLoading,
    login,
    logout,
    register,
    verifyOTP,
    resendOTP,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};