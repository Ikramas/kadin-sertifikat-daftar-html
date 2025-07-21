// File: src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRegistrationData } from '@/types/user';
import type { Company, Document } from '@/types/company'; // Import Document type

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isDocumentVerified: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  // useCallback untuk fetchUserProfile agar tidak dibuat ulang setiap render
  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setCompany(null);
      setIsDocumentVerified(false); 
      setIsLoading(false);
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
          // Token tidak valid atau kadaluarsa, paksa logout
          throw new Error('Unauthorized');
      }
        
      if (!response.ok) {
        // Tangani jika ada error lain dari server
        const errorData = await response.json().catch(() => ({ message: 'Terjadi kesalahan tidak dikenal.' }));
        throw new Error(errorData.message || 'Gagal memuat profil pengguna');
      }

      const data = await response.json();
      if (data.status === 'success') {
        // Memastikan documents disimpan di user state
        // Gunakan interface Document yang sudah diimport
        const fetchedUser: User = { ...data.data.user, documents: data.data.documents || [] };
        setUser(fetchedUser);
        setCompany(data.data.company || null);
        setIsAuthenticated(true);

        // DEBUG HACK: Letakkan objek dokumen di window untuk inspeksi konsol
        (window as any).AUTH_CONTEXT_DEBUG_USER_DOCUMENTS = data.data.documents;
        console.log("DEBUG: Dokumen dari AuthContext:", (window as any).AUTH_CONTEXT_DEBUG_USER_DOCUMENTS);

      } else {
        throw new Error(data.message || 'Gagal memuat data profil');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      // Hapus token dan reset state jika ada error saat fetch profil (misalnya unauthorized)
      localStorage.removeItem('token');
      setUser(null);
      setCompany(null);
      setIsAuthenticated(false);
      setIsDocumentVerified(false); 
      (window as any).AUTH_CONTEXT_DEBUG_USER_DOCUMENTS = null; // Bersihkan debug
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependensi kosong karena fungsi ini tidak bergantung pada state yang berubah di dalam dirinya sendiri, tapi akan dipanggil ulang jika objek fungsi berubah.

  // Efek untuk memuat profil pengguna saat komponen dimount atau fetchUserProfile berubah
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]); // fetchUserProfile adalah dependensi karena dia adalah fungsi useCallback

  // Efek untuk menentukan status isDocumentVerified
  useEffect(() => {
    if (user && company) {
      // Status 'active' dan 'verified' dari user DAN status 'verified' dari company
      const isVerified = (user.status === 'active' || user.status === 'verified') && company.status === 'verified';
      setIsDocumentVerified(isVerified);
    } else {
      setIsDocumentVerified(false);
    }
  }, [user, company]); // Dependensi pada user dan company

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
      await fetchUserProfile(); // Refresh profil setelah login berhasil
    } else {
      // Melemparkan error untuk ditangani di komponen panggilan (misalnya halaman Login)
      throw new Error(data.message || 'Login gagal. Periksa kembali kredensial Anda.');
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            // Memanggil API logout di backend untuk menghapus token dari denylist
            await fetch('/backend/api/auth/logout.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error('Logout request failed (backend):', error);
            // Tetap lanjutkan logout di frontend meskipun backend gagal (misal token sudah kadaluarsa)
        }
    }
    // Hapus token dari localStorage dan reset semua state frontend
    localStorage.removeItem('token');
    setUser(null);
    setCompany(null);
    setIsAuthenticated(false);
    setIsDocumentVerified(false);
    (window as any).AUTH_CONTEXT_DEBUG_USER_DOCUMENTS = null; // Bersihkan debug
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
    return data; // Mengembalikan data untuk penanganan lebih lanjut (misalnya redirect ke verify-otp)
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
      await fetchUserProfile(); // Refresh profil setelah OTP diverifikasi (status user mungkin berubah)
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
        waitTime: data.data.wait_time || data.data.cooldown_seconds || 30, // Mengambil waitTime dari respons backend
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