// src/pages/Login.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast'; 
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Eye, EyeOff, ArrowRight, Shield, FileText, BadgeCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi')
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { toast } = useToast();
  const { handleError, handleSuccess } = useErrorHandler();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      handleSuccess('Selamat datang di Portal SBU Kadin Indonesia!', 'Login Berhasil');
      navigate('/dashboard');
    } catch (error: any) {
      handleError(error, 'authentication', { email: data.email }); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5F5F0]">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#005191] to-[#003366] relative overflow-hidden p-8">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48L3N2Zz4=')]"></div>
        
        {/* Floating elements */}
        <div className="absolute w-80 h-80 bg-[#D4AF37]/5 rounded-full -left-40 -top-40"></div>
        <div className="absolute w-48 h-48 bg-[#D4AF37]/10 rounded-full bottom-20 right-20"></div>
        
        <div className="relative z-10 flex flex-col justify-between h-full w-full">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 36C27.9411 36 36 27.9411 36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 27.9411 8.05887 36 18 36Z" fill="#005191"/>
                <path d="M12 24V12H16V24H12ZM20 24V12H24V24H20Z" fill="white"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">KADIN INDONESIA</h1>
              <p className="text-sm text-white/90">Sertifikasi Badan Usaha</p>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-lg mx-auto text-center">
            <h1 className="text-4xl font-bold text-white leading-tight mb-6">
              PORTAL PERPANJANGAN SBU
            </h1>
            <p className="text-lg text-white/90 mb-8">
              Sistem terintegrasi untuk pendaftaran dan perpanjangan Sertifikat Badan Usaha anggota KADIN Indonesia
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/15">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <FileText className="text-[#D4AF37] h-6 w-6" />
                  <h3 className="font-medium text-white">Pendaftaran SBU</h3>
                </div>
                <p className="text-sm text-white/80">
                  Proses pengajuan sertifikasi baru untuk badan usaha
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/15">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <BadgeCheck className="text-[#D4AF37] h-6 w-6" />
                  <h3 className="font-medium text-white">Perpanjangan SBU</h3>
                </div>
                <p className="text-sm text-white/80">
                  Perpanjang masa berlaku sertifikat badan usaha Anda
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-white/70 text-sm">
            © {new Date().getFullYear()} Kamar Dagang dan Industri Indonesia
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative">
        {/* Mobile header */}
        <div className="absolute top-6 left-6 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#005191] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">KADIN</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#005191]">KADIN INDONESIA</h1>
              <p className="text-xs text-[#666666]">Portal Perpanjangan SBU</p>
            </div>
          </div>
        </div>
        
        <Card className="w-full max-w-md shadow-lg border-0 bg-white">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="hidden lg:flex justify-center">
              <div className="w-16 h-16 bg-[#005191] rounded-2xl flex items-center justify-center shadow-lg">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="8" fill="#005191"/>
                  <rect x="8" y="8" width="5" height="16" fill="white"/>
                  <rect x="19" y="8" width="5" height="16" fill="white"/>
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl lg:text-3xl font-bold text-[#333333]">Masuk ke Portal SBU</CardTitle>
              <p className="text-[#666666] text-sm lg:text-base">
                Akses layanan pendaftaran dan perpanjangan sertifikasi badan usaha
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-6 lg:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#333333]">
                  Email Terdaftar
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="cth: perusahaan@email.com" 
                  {...register('email')} 
                  className={`h-12 text-base rounded-lg border ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-[#CCCCCC] focus:border-[#005191]'}`} 
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#333333]">
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Masukkan kata sandi Anda" 
                    {...register('password')} 
                    className={`h-12 text-base rounded-lg border pr-12 ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-[#CCCCCC] focus:border-[#005191]'}`} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-[#005191] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    className="w-4 h-4 text-[#005191] border-[#CCCCCC] rounded focus:ring-[#005191]"
                  />
                  <label htmlFor="remember" className="text-sm text-[#333333]">
                    Ingat perangkat ini
                  </label>
                </div>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-[#005191] hover:text-[#003366] font-medium transition-colors"
                >
                  Lupa kata sandi?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold rounded-lg bg-[#005191] hover:bg-[#003366] transition-colors shadow-md"
                disabled={isLoading}
              >
                {isLoading ? 'Memproses...' : (
                  <>
                    Masuk <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-[#666666]">
              Belum memiliki akun? {' '}
              <Link 
                to="/register" 
                className="text-[#005191] hover:text-[#003366] font-medium transition-colors"
              >
                Registrasi Akun SBU
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#666666]">
              <Shield className="h-4 w-4 text-[#005191]" />
              <span>Sistem terjamin keamanannya dengan enkripsi tingkat tinggi</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}