// File: src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRegistrationData } from '@/types/user';
import type { Company } from '@/types/company';

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

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setCompany(null);
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
          throw new Error('Unauthorized');
      }
        
      if (!response.ok) {
        throw new Error('Gagal memuat profil pengguna');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setUser(data.data.user);
        setCompany(data.data.company || null);
        setIsAuthenticated(true);
      } else {
        throw new Error(data.message || 'Gagal memuat data profil');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      localStorage.removeItem('token');
      setUser(null);
      setCompany(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (user && company) {
      const isVerified = (user.status === 'active' || user.status === 'verified') && company.status === 'verified';
      setIsDocumentVerified(isVerified);
    } else {
      setIsDocumentVerified(false);
    }
  }, [user, company]);

  const login = async (email: string, password: string) => {
    // 1. Dapatkan CSRF token terlebih dahulu
    const csrfResponse = await fetch('/backend/api/auth/csrf-token.php');
    const csrfData = await csrfResponse.json();
    if (csrfData.status !== 'success' || !csrfData.data.csrf_token) {
        throw new Error('Gagal mendapatkan token keamanan.');
    }
    const csrfToken = csrfData.data.csrf_token;
  
    // 2. Kirim request login dengan CSRF token
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
      
      // ===== INI BAGIAN KUNCI PERBAIKANNYA =====
      // Langsung panggil fetchUserProfile setelah token diterima.
      // Ini akan mengisi state 'user' dan 'company' dengan data lengkap
      // secara real-time tanpa perlu refresh halaman.
      await fetchUserProfile();
      // ==========================================

    } else {
      throw new Error(data.message || 'Login gagal. Periksa kembali kredensial Anda.');
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            await fetch('/backend/api/auth/logout.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error('Logout request failed:', error);
        }
    }
    localStorage.removeItem('token');
    setUser(null);
    setCompany(null);
    setIsAuthenticated(false);
    setIsDocumentVerified(false);
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
    if (data.status !== 'success') {
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