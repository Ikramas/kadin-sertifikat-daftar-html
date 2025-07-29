// File: src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'; 
import type { User, UserRegistrationData } from '@/types/user'; 
import type { Company, Document } from '@/types/company'; 

// Definisi interface untuk tipe konteks autentikasi
// Ini mendefinisikan properti dan fungsi yang akan tersedia melalui `useAuth`.
interface AuthContextType {
  user: User | null;                  // Objek pengguna yang sedang login
  company: Company | null;            // Objek data perusahaan yang terkait dengan pengguna
  isAuthenticated: boolean;           // Status autentikasi pengguna (true jika sudah login)
  isDocumentVerified: boolean;        // Status verifikasi dokumen pengguna/perusahaan
  isLoading: boolean;                 // Status loading saat data autentikasi/profil sedang diambil
  login: (email: string, password: string) => Promise<void>; // Fungsi untuk login
  logout: (redirect?: boolean) => Promise<void>; // Fungsi untuk logout, dengan parameter redirect opsional
  register: (userData: UserRegistrationData) => Promise<any>; // Fungsi untuk registrasi pengguna baru
  verifyOTP: (email: string, otp: string) => Promise<any>; // Fungsi untuk verifikasi OTP
  resendOTP: (email: string) => Promise<{ waitTime: number; message: string }>; // Fungsi untuk mengirim ulang OTP
  fetchUserProfile: () => Promise<void>; // Fungsi untuk mengambil profil pengguna dari backend
}

// Buat React Context dengan tipe yang ditentukan.
// `undefined` adalah nilai default sebelum provider tersedia.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook kustom `useAuth` untuk mengkonsumsi nilai dari AuthContext.
 * Memastikan hook digunakan di dalam `AuthProvider`.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Melempar error jika hook digunakan di luar lingkup AuthProvider.
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Komponen `AuthProvider` yang menyediakan state dan fungsi autentikasi
 * ke semua komponen anak yang dibungkus di dalamnya.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State-state lokal untuk mengelola status autentikasi dan data pengguna/perusahaan.
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDocumentVerified, setIsDocumentVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Default ke true saat aplikasi dimulai untuk fetch awal.

  // Konstanta untuk waktu timeout inaktivitas (1 jam).
  const INACTIVITY_TIMEOUT = 60 * 60 * 1000; 
  // Ref untuk menyimpan ID timer inaktivitas, agar bisa dibersihkan.
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fungsi internal untuk membersihkan semua state autentikasi lokal.
  const clearAuthStates = useCallback(() => {
    setUser(null);
    setCompany(null);
    setIsAuthenticated(false);
    setIsDocumentVerified(false); // Pastikan ini juga direset saat logout
    // (window as any).AUTH_CONTEXT_DEBUG_USER_DOCUMENTS = null; // Debug line dinonaktifkan

    // Pastikan timer inaktivitas juga dihentikan saat state dibersihkan
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []); // Dependensi kosong karena tidak bergantung pada state/props lain

  // Fungsi logout utama.
  // Akan menghapus token, membersihkan state, dan opsional melakukan redirect.
  const logout = useCallback(async (redirect: boolean = true) => {
    // console.log("Melakukan logout..."); // Debug line dinonaktifkan
    const token = localStorage.getItem('token');
    
    // Clear state autentikasi lokal sebelum menghapus token dari local storage
    clearAuthStates();
    
    // Kirim beacon ke backend untuk denylist token (dilakukan jika ada token)
    // `sendBeacon` lebih reliable untuk logout saat halaman akan ditutup/di-unload,
    // karena browser menjamin permintaan akan dikirim meskipun halaman segera ditutup.
    if (token) {
      try {
        navigator.sendBeacon('/backend/api/auth/logout.php', JSON.stringify({ token }));
        // console.log("SendBeacon logout dikirim."); // Debug line dinonaktifkan
      } catch (error) {
        console.error('Logout request (sendBeacon) failed:', error);
      }
    }
    
    // Hapus token dari localStorage. Ini adalah bagian krusial agar sesi tidak persistent.
    // Selalu hapus token di sini, karena fungsi ini dipanggil untuk logout *final*.
    localStorage.removeItem('token'); 

    // Redirect hanya jika diinstruksikan.
    // Penting untuk tidak redirect saat browser ditutup paksa (karena ini akan dilakukan oleh `window.location.href`).
    if (redirect) {
        // Menggunakan `window.location.href` untuk memaksa refresh penuh halaman dan redirect.
        // Ini memastikan semua state React dan cache browser direset.
        window.location.href = '/login'; 
    }
  }, [clearAuthStates]); // `clearAuthStates` adalah dependensi.

  // Fungsi untuk mereset timer tidak aktif pengguna.
  const resetInactivityTimer = useCallback(() => {
    // Bersihkan timer yang ada jika ada
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set timer baru hanya jika pengguna saat ini terautentikasi.
    if (isAuthenticated) { 
      inactivityTimerRef.current = setTimeout(() => {
        // console.log("Logout karena inaktivitas."); // Debug line dinonaktifkan
        logout(true); // Logout otomatis karena inaktivitas, akan redirect ke login
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

      // Jika token tidak valid atau kadaluarsa (status 401 Unauthorized)
      if (response.status === 401) {
          // Token tidak valid atau kadaluarsa. Panggil logout tanpa redirect segera.
          // `ProtectedRoute` kemudian akan mendeteksi `!isAuthenticated` dan mengalihkan ke `/login`.
          // console.log("Token tidak valid atau kadaluarsa. Memicu logout non-redirect."); // Debug line dinonaktifkan
          await logout(false); // Panggil logout tanpa paksa redirect dari sini
          return; // Penting untuk return agar tidak melanjutkan ke blok try/catch yang salah
      }

      // Jika respons bukan OK (misalnya 4xx atau 5xx lainnya)
      if (!response.ok) {
        // Coba parse error message dari respons JSON, atau berikan pesan default.
        const errorData = await response.json().catch(() => ({ message: 'Terjadi kesalahan tidak dikenal.' }));
        throw new Error(errorData.message || 'Gagal memuat profil pengguna');
      }

      const data = await response.json();
      if (data.status === 'success') {
        // Perbarui state pengguna dan perusahaan dengan data yang diambil.
        // Asumsi `data.data.user` dan `data.data.company` serta `data.data.documents` ada.
        const fetchedUser: User = { ...data.data.user, documents: data.data.documents || [] };
        const fetchedCompany: Company | null = data.data.company || null;

        setUser(fetchedUser);
        setCompany(fetchedCompany);
        setIsAuthenticated(true);
        
        // --- KRUSIAL: HITUNG isDocumentVerified DI SINI, SETELAH user DAN company DISET ---
        // Ini memastikan `isDocumentVerified` diatur sebelum `isLoading` menjadi `false`.
        const isVerified = (fetchedUser.status === 'active' || fetchedUser.status === 'verified') && 
                           (fetchedCompany && fetchedCompany.status === 'verified');
        setIsDocumentVerified(isVerified);
        // ----------------------------------------------------------------------------------

        resetInactivityTimer(); // Reset timer setelah aktivitas berhasil (fetch profil)

        // Debugging info (opsional, bisa dihapus di produksi)
        // (window as any).AUTH_CONTEXT_DEBUG_USER_DOCUMENTS = data.data.documents; // Debug line dinonaktifkan
        // console.log("DEBUG: Dokumen dari AuthContext:", (window as any).AUTH_CONTEXT_DEBUG_USER_DOCUMENTS); // Debug line dinonaktifkan

      } else {
        // Jika backend merespons dengan status non-sukses.
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

  // Efek pertama kali saat komponen `AuthProvider` dimuat untuk mengambil profil pengguna.
  useEffect(() => {
    // console.log('AuthContext useEffect: Running fetchUserProfile'); // Debug line dinonaktifkan
    // Jalankan `fetchUserProfile` hanya sekali saat komponen pertama kali di-mount.
    // Status `isLoading` di AuthProvider akan menangani penundaan render UI.
    fetchUserProfile();
  }, [fetchUserProfile]); // Dependensi pada `fetchUserProfile` (karena itu adalah useCallback).

  // Efek untuk mengelola event aktivitas pengguna (mouse, keyboard, scroll)
  // untuk mereset timer inaktivitas.
  useEffect(() => {
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Mulai/reset timer saat komponen di-mount atau saat status authenticated berubah
    if (isAuthenticated) {
        resetInactivityTimer();
    }

    // Cleanup: hapus timer dan event listener saat komponen di-unmount.
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [isAuthenticated, resetInactivityTimer]); // Dependensi: `isAuthenticated` dan `resetInactivityTimer`.

  // Efek untuk menangani refresh halaman (sebagai 'isReloading') dan penutupan tab/browser.
  // Ini adalah logika yang paling krusial untuk membedakan refresh dari close.
  useEffect(() => {
    // Handler `beforeunload`: dipicu sebelum halaman di-unload (misal, refresh, tutup tab).
    const handleBeforeUnload = () => {
      // Set flag di `sessionStorage` untuk menandakan ini adalah reload/refresh.
      // `sessionStorage` akan dihapus saat tab/browser benar-benar ditutup.
      sessionStorage.setItem('isReloading', 'true');
    };

    // Handler `unload`: dipicu ketika halaman benar-benar akan dibongkar.
    const handleUnload = () => {
      // Logic di sini dijalankan sesaat sebelum halaman dibongkar.
      // Jika 'isReloading' TIDAK ADA di sessionStorage, berarti ini penutupan tab/browser yang sebenarnya.
      // Maka token HARUS dihapus dari `localStorage`.
      if (sessionStorage.getItem('isReloading') !== 'true') {
        // console.log("Tab/browser ditutup, menghapus token dari localStorage."); // Debug line dinonaktifkan
        localStorage.removeItem('token'); // Hapus token secara lokal
        // Tidak perlu panggil `logout(false)` di sini karena `sendBeacon` sudah dipanggil
        // di fungsi `logout` jika ada token. Ini untuk memastikan penghapusan lokal saja.
      } else {
        // Ini adalah refresh, flag 'isReloading' akan ada.
        // Token di `localStorage` dipertahankan agar `fetchUserProfile` bisa membacanya lagi.
        // console.log("Halaman di-refresh, mempertahankan token di localStorage."); // Debug line dinonaktifkan
      }
      // Hapus flag setelah setiap unload untuk mereset kondisi untuk kunjungan berikutnya.
      sessionStorage.removeItem('isReloading');
    };

    // Tambahkan event listener untuk `beforeunload` dan `unload`.
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    // Cleanup: hapus event listener saat komponen di-unmount.
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, []); // Dependensi kosong karena fungsi ini hanya berinteraksi dengan DOM API dan sessionStorage

  // Fungsi untuk login pengguna.
  const login = async (email: string, password: string) => {
    // Ambil token CSRF terlebih dahulu.
    const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
    const csrfData = await csrfResponse.json();
    if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
        throw new Error('Gagal mendapatkan token keamanan.');
    }
    const csrfToken = csrfData.data.csrf_token;

    // Kirim kredensial login ke backend.
    const response = await fetch('/backend/api/auth/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken, // Sertakan token CSRF
      },
      body: JSON.stringify({ email, password, csrf_token: csrfToken }), // Sertakan token CSRF di body
    });

    const data = await response.json();

    // Jika login berhasil, simpan token dan fetch profil pengguna.
    if (data.status === 'success' && data.data.token) {
      localStorage.setItem('token', data.data.token);
      await fetchUserProfile(); // Setelah login, langsung fetch profil untuk update state
    } else {
      // Jika login gagal, lempar error.
      throw new Error(data.message || 'Login gagal. Periksa kembali kredensial Anda.');
    }
  };

  // Fungsi untuk registrasi pengguna baru.
  const register = async (userData: UserRegistrationData) => {
    // Ambil token CSRF terlebih dahulu.
    const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
    const csrfData = await csrfResponse.json();
    if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
      throw new Error('Gagal mendapatkan token keamanan.');
    }
    const csrfToken = csrfData.data.csrf_token;

    // Kirim data registrasi ke backend.
    const response = await fetch('/backend/api/auth/register.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken, // Sertakan token CSRF
      },
      body: JSON.stringify({ ...userData, csrf_token: csrfToken }), // Sertakan token CSRF di body
    });

    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(data.message || 'Registrasi gagal.');
    }
    return data; // Kembalikan data respons (misal: untuk pesan sukses atau ID pengguna).
  };

  // Fungsi untuk verifikasi OTP (One-Time Password).
  const verifyOTP = async (email: string, otp: string) => {
    // Ambil token CSRF terlebih dahulu.
    const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
    const csrfData = await csrfResponse.json();
    if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
      throw new Error('Gagal mendapatkan token keamanan.');
    }
    const csrfToken = csrfData.data.csrf_token;
      
    // Kirim email dan OTP untuk verifikasi.
    const response = await fetch('/backend/api/auth/verify-otp.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken, // Sertakan token CSRF
      },
      body: JSON.stringify({ email, otp, csrf_token: csrfToken }), // Sertakan token CSRF di body
    });

    const data = await response.json();
    if (data.status === 'success') {
      await fetchUserProfile(); // Setelah verifikasi OTP berhasil, fetch profil pengguna
    } else {
      throw new Error(data.message || 'Verifikasi OTP gagal.');
    }
    return data; // Kembalikan data respons.
  };

  // Fungsi untuk mengirim ulang OTP.
  const resendOTP = async (email: string) => {
    // Ambil token CSRF terlebih dahulu.
    const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
    const csrfData = await csrfResponse.json();
    if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
      throw new Error('Gagal mendapatkan token keamanan.');
    }
    const csrfToken = csrfData.data.csrf_token;

    // Kirim permintaan untuk mengirim ulang OTP.
    const response = await fetch('/backend/api/auth/resend-otp.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken, // Sertakan token CSRF
      },
      body: JSON.stringify({ email, csrf_token: csrfToken }), // Sertakan token CSRF di body
    });

    const data = await response.json();
    if (data.status === 'success') {
      return {
        waitTime: data.data.wait_time || data.data.cooldown_seconds || 30, // Waktu tunggu sebelum bisa kirim ulang
        message: data.message,
      };
    } else {
      throw new Error(data.message || 'Gagal mengirim ulang OTP.');
    }
  };

  // Objek `value` yang akan disediakan oleh AuthContext.Provider.
  // Ini berisi semua state dan fungsi yang dapat diakses oleh konsumen konteks.
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

  // Mengembalikan provider konteks yang membungkus children-nya.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
