import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const otpSchema = z.object({
  otp: z.string().length(6, 'Kode OTP harus 6 digit'),
});

type OTPForm = z.infer<typeof otpSchema>;

export default function VerifyOTP() {
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const { verifyOTP, resendOTP } = useAuth();
  const { toast } = useToast();
  const { handleError, handleSuccess } = useErrorHandler();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
  });

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  const onSubmit = async (data: OTPForm) => {
    setIsLoading(true);
    try {
      await verifyOTP(email, data.otp);
      handleSuccess(
        'Email Anda telah berhasil diverifikasi. Silakan login untuk melanjutkan.',
        'Verifikasi Berhasil'
      );
      navigate('/login');
    } catch (error: any) {
      handleError(error, 'verification', {
        email,
        otp_length: data.otp.length
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    try {
      const result = await resendOTP(email);
      setResendCooldown(result.waitTime);
      setCanResend(false);
      
      handleSuccess(
        result.message || 'Kode OTP baru telah dikirim ke email Anda',
        'OTP Berhasil Dikirim'
      );
    } catch (error: any) {
      handleError(error, 'resend_otp', {
        email,
        attempt: 'resend'
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds} detik`;
  };

  if (!email) {
    navigate('/register');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - OTP Form */}
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
              <CardTitle className="text-2xl lg:text-3xl font-bold text-primary">Verifikasi Email</CardTitle>
              <p className="text-muted-foreground text-sm lg:text-base">
                Masukkan kode verifikasi 6 digit yang telah dikirim ke:
              </p>
              <p className="font-medium text-foreground">{email}</p>
            </div>
          </CardHeader>
          <CardContent className="p-6 lg:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium text-foreground">Kode Verifikasi (6 digit)</Label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className={`text-center text-2xl font-mono h-12 rounded-xl border-2 transition-all duration-200 ${errors.otp ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`}
                  {...register('otp')}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {errors.otp && (
                  <p className="text-sm text-destructive">{errors.otp.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary-light transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" disabled={isLoading}>
                {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Tidak menerima kode?
              </p>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleResendOTP}
                disabled={!canResend}
                className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-200"
              >
                {canResend 
                  ? 'Kirim Ulang Kode OTP' 
                  : `Kirim Ulang dalam ${formatTime(resendCooldown)}`
                }
              </Button>

              <p className="text-xs text-muted-foreground">
                {resendCooldown <= 30 && resendCooldown > 0 && (
                  "Tunggu 30 detik sebelum mengirim ulang"
                )}
                {resendCooldown > 30 && resendCooldown <= 300 && (
                  "Permintaan berikutnya dapat dilakukan dalam 5 menit"
                )}
                {resendCooldown > 300 && (
                  "Permintaan berikutnya dapat dilakukan dalam 15 menit"
                )}
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
                <h1 className="text-3xl font-bold leading-tight">VERIFIKASI EMAIL</h1>
                <p className="text-xl opacity-90 font-medium">Portal Sertifikasi Kadin</p>
                <div className="w-16 h-1 bg-white/60 mx-auto rounded-full"></div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <img 
                src="/lovable-uploads/ab2fa65f-e5a9-4706-80c0-39537a1c0dfd.png" 
                alt="Certificate Verification"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">SERTIFIKAT BADAN USAHA</h2>
              <p className="text-white/80 text-sm max-w-xs mx-auto">Verifikasi email Anda untuk mengakses sistem sertifikasi Kadin Indonesia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}