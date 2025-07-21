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
import { Eye, EyeOff } from 'lucide-react';
const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi')
});
type LoginForm = z.infer<typeof loginSchema>;
export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    login
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });
  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: 'Login Berhasil',
        description: 'Selamat datang di Portal SBU Kadin Indonesia'
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login Gagal',
        description: error.message || 'Terjadi kesalahan saat login',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-background relative">
        {/* Mobile header */}
        <div className="absolute top-4 left-4 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">KI</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary">KADIN INDONESIA</h1>
              <p className="text-xs text-muted-foreground">Portal Sertifikasi SBU</p>
            </div>
          </div>
        </div>
        
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm mt-16 lg:mt-0">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="hidden lg:flex justify-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-xl">KI</span>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl lg:text-3xl font-bold text-primary">Selamat Datang</CardTitle>
              <p className="text-muted-foreground text-sm lg:text-base">Masuk ke akun Portal SBU Kadin Indonesia</p>
            </div>
          </CardHeader>
          <CardContent className="p-6 lg:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                <Input id="email" type="email" placeholder="contoh@email.com" {...register('email')} className={`h-12 text-base rounded-xl border-2 transition-all duration-200 ${errors.email ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Masukkan password" {...register('password')} className={`h-12 text-base rounded-xl border-2 pr-12 transition-all duration-200 ${errors.password ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-light transition-colors font-medium">
                  Lupa kata sandi?
                </Link>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary-light transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" disabled={isLoading}>
                {isLoading ? 'Masuk...' : 'Masuk'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-sm">
                Belum punya akun? {' '}
                <Link to="/register" className="text-primary hover:text-primary-light font-semibold transition-colors">
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Branding - Hidden on mobile */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary-dark to-primary relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary-dark/90"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32"></div>
        
        <div className="relative z-10 flex items-center justify-center p-8 w-full">
          <div className="text-center text-primary-foreground space-y-8 max-w-md">
            <div className="space-y-6">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                <span className="text-white font-bold text-3xl">KI</span>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold leading-tight">BADAN SERTIFIKASI KADIN</h1>
                <p className="text-xl opacity-90 font-medium">Portal Sertifikasi Kadin</p>
                <div className="w-16 h-1 bg-white/60 mx-auto rounded-full"></div>
              </div>
            </div>
            
            
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">SERTIFIKAT BADAN USAHA</h2>
              <p className="text-white/80 text-sm max-w-xs mx-auto">Sistem terpadu untuk pengelolaan sertifikat badan usaha Kadin Indonesia</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
}