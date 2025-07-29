import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const registerSchema = z.object({
  // User data
  name: z.string().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  // Company data
  businessEntityType: z.string().min(1, 'Bentuk perusahaan wajib dipilih'),
  companyName: z.string().min(1, 'Nama perusahaan wajib diisi'), 
  npwp: z.string().min(20, 'NPWP tidak valid. Minimal 15 digit angka (XX.XXX.XXX.X-XXX.XXX)')
          .regex(/^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/, 'Format NPWP tidak valid (XX.XXX.XXX.X-XXX.XXX)'),
  nib: z.string().min(13, 'NIB minimal 13 digit').max(16, 'NIB maksimal 16 digit').regex(/^\d+$/, 'NIB harus berupa angka'), 
  businessType: z.string().min(1, 'Jenis usaha wajib dipilih'),
  employeeCount: z.string().min(1, 'Jumlah karyawan wajib diisi'), 
  // Terms
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'Anda harus menyetujui syarat dan ketentuan'
  })
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Konfirmasi password tidak sesuai',
      path: ['confirmPassword']
    });
  }
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingNpwp, setIsCheckingNpwp] = useState(false);
  const [npwpCheckResult, setNpwpCheckResult] = useState<'found' | 'not_found' | 'error' | null>(null);
  const [isCheckingNib, setIsCheckingNib] = useState(false);
  const [nibCheckResult, setNibCheckResult] = useState<'found' | 'not_found' | 'error' | null>(null);

  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const { handleError, handleSuccess, handleValidationErrors } = useErrorHandler();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange'
  });

  const watchedNpwp = watch('npwp');
  const watchedNib = watch('nib');
  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');
  const termsAccepted = watch('termsAccepted');

  // Enhanced real-time validation for password matching
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'password' || name === 'confirmPassword') {
        trigger('confirmPassword');
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, trigger]);

  const formatNPWP = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    let formatted = '';

    if (cleanValue.length > 0) formatted += cleanValue.substring(0, 2);
    if (cleanValue.length > 2) formatted += '.' + cleanValue.substring(2, 5);
    if (cleanValue.length > 5) formatted += '.' + cleanValue.substring(5, 8);
    if (cleanValue.length > 8) formatted += '.' + cleanValue.substring(8, 9);
    if (cleanValue.length > 9) formatted += '-' + cleanValue.substring(9, 12);
    if (cleanValue.length > 12) formatted += '.' + cleanValue.substring(12, 15);
    
    return formatted.substring(0, 20);
  };

  const handleNPWPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNPWP(e.target.value);
    setValue('npwp', formatted, { shouldValidate: true });
    setNpwpCheckResult(null);
  };

  const handleNibChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('nib', e.target.value.replace(/\D/g, ''), { shouldValidate: true });
    setNibCheckResult(null);
  };

  const handleNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const checkNpwpInDatabase = async () => {
    const npwp = watchedNpwp;
    const isNpwpValidFormat = /^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/.test(npwp ?? '');

    if (!npwp || !isNpwpValidFormat || errors.npwp) { 
      setNpwpCheckResult('error'); 
      toast({
        title: 'Validasi NPWP Gagal',
        description: 'Format NPWP tidak valid. Pastikan NPWP mengikuti format XX.XXX.XXX.X-XXX.XXX.',
        variant: 'destructive',
      });
      return;
    }

    setIsCheckingNpwp(true);
    setNpwpCheckResult(null);
    try {
      const response = await fetch('/backend/api/auth/check_registration_data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'npwp', value: npwp }), 
      });
      const data = await response.json(); 

      if (data.status === 'success') { 
        if (!!data.found) {
          setNpwpCheckResult('found');
          toast({
            title: 'NPWP Sudah Terdaftar',
            description: 'NPWP ini sudah digunakan untuk pendaftaran lain. Silakan periksa kembali atau gunakan NPWP yang berbeda.',
            variant: 'destructive',
          });
        } else {
          setNpwpCheckResult('not_found');
          toast({
            title: 'NPWP Tersedia',
            description: 'NPWP ini belum terdaftar dan dapat digunakan untuk pendaftaran.',
            variant: 'success',
          });
        }
      } else {
        setNpwpCheckResult('error');
        toast({
          title: 'Kesalahan Server',
          description: data.message || 'Terjadi kesalahan saat memeriksa NPWP. Mohon coba lagi nanti.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setNpwpCheckResult('error');
      toast({
        title: 'Kesalahan Jaringan',
        description: error.message || 'Tidak dapat terhubung ke server untuk memeriksa NPWP. Pastikan koneksi internet Anda stabil.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingNpwp(false);
    }
  };

  const checkNibInDatabase = async () => {
    const nib = watchedNib;
    const cleanNibValue = (nib ?? '').replace(/\D/g, ''); 

    if (!nib || cleanNibValue.length < 13 || errors.nib) { 
      setNibCheckResult('error');
      toast({
        title: 'Validasi NIB Gagal',
        description: 'NIB tidak valid. NIB minimal 13 digit angka.',
        variant: 'destructive',
      });
      return;
    }

    setIsCheckingNib(true);
    setNibCheckResult(null);
    try {
      const response = await fetch('/backend/api/auth/check_registration_data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'nib', value: nib }), 
      });
      const data = await response.json();
      
      if (data.status === 'success') { 
        if (!!data.found) {
          setNibCheckResult('found');
          toast({
            title: 'NIB Sudah Terdaftar',
            description: 'NIB ini sudah digunakan untuk pendaftaran lain. Silakan periksa kembali atau gunakan NIB yang berbeda.',
            variant: 'destructive',
          });
        } else {
          setNibCheckResult('not_found');
          toast({
            title: 'NIB Tersedia',
            description: 'NIB ini belum terdaftar dan dapat digunakan untuk pendaftaran.',
            variant: 'success',
          });
        }
      } else { 
        setNibCheckResult('error');
        toast({
          title: 'Kesalahan Server',
          description: data.message || 'Terjadi kesalahan saat memeriksa NIB. Mohon coba lagi nanti.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setNibCheckResult('error');
      toast({
        title: 'Kesalahan Jaringan',
        description: error.message || 'Tidak dapat terhubung ke server untuk memeriksa NIB. Pastikan koneksi internet Anda stabil.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingNib(false);
    }
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      const step1Fields = ['name', 'email', 'phone', 'password', 'confirmPassword'] as const;
      const isValid = await trigger(step1Fields);
      
      if (!isValid) {
        const step1Errors: Record<string, string> = {};
        step1Fields.forEach(field => {
          if (errors[field]) {
            step1Errors[field] = errors[field]?.message as string;
          }
        });
        handleValidationErrors(step1Errors, 'Validasi Data Pribadi Gagal');

        if (errors.confirmPassword) {
          toast({
            title: 'Kesalahan Konfirmasi Kata Sandi',
            description: errors.confirmPassword.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Validasi Formulir Gagal',
            description: 'Mohon lengkapi semua bidang yang wajib diisi dan perbaiki kesalahan pada Data Pribadi Anda.',
            variant: 'destructive',
          });
        }
        return;
      }
    }
    setCurrentStep(2);
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      if (npwpCheckResult !== 'not_found') {
        toast({
          title: 'Pendaftaran Dibatalkan',
          description: 'NPWP Anda belum diverifikasi atau sudah terdaftar. Mohon pastikan NPWP Anda sudah dicek dan tersedia.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      if (nibCheckResult !== 'not_found') {
        toast({
          title: 'Pendaftaran Dibatalkan',
          description: 'NIB Anda belum diverifikasi atau sudah terdaftar. Mohon pastikan NIB Anda sudah dicek dan tersedia.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const registrationData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
        businessEntityType: data.businessEntityType,
        companyName: data.companyName,
        npwp: data.npwp, 
        nib: data.nib, 
        businessType: data.businessType,
        employeeCount: data.employeeCount,
        termsAccepted: data.termsAccepted,
        province: '', 
        regencyCity: '', 
        district: '', 
        village: '', 
        leaderName: '', 
        leaderPosition: '', 
        leaderNik: '', 
        leaderNpwp: '', 
        ktaKadinNumber: '', 
        ktaDate: '', 
        address: '',
        city: '',
        postalCode: '',
        companyPhone: '',
        companyEmail: '',
        investmentValue: '',
      };

      await registerUser(registrationData);
      
      handleSuccess(
        'Pendaftaran Berhasil!',
        'Kode OTP telah dikirim ke email Anda. Silakan periksa kotak masuk email Anda untuk verifikasi.'
      );
      
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      
    } catch (error: any) {
      handleError(
        error, 
        'Pendaftaran Gagal', 
        error.message || 'Terjadi kesalahan saat mencoba mendaftar. Mohon periksa kembali data Anda dan coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderCheckStatusIcon = (status: 'found' | 'not_found' | 'error' | null, isLoading: boolean) => {
    if (isLoading) {
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    }
    if (status === 'found') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (status === 'not_found') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (status === 'error') {
      return <XCircle className="w-5 h-5 text-destructive" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Left Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900"></div>

        {/* Mobile Header */}
        <div className="absolute top-4 left-4 lg:hidden z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow">
              <span className="text-primary-foreground font-bold text-sm">KI</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary dark:text-primary-light">KADIN INDONESIA</h1>
              <p className="text-xs text-muted-foreground dark:text-gray-400">Portal Sertifikasi SBU</p>
            </div>
          </div>
        </div>
        
        {/* Registration Form */}
        <div className="w-full max-w-3xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-6 lg:p-8 relative z-10">
          <div className="text-center space-y-4 pb-6 pt-2"> 
            <div className="hidden lg:flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-md"> 
                <span className="text-primary-foreground font-bold text-xl">KI</span>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl lg:text-3xl font-extrabold text-primary dark:text-primary-light">Bergabung</h1>
              <p className="text-muted-foreground text-sm lg:text-base dark:text-gray-300">Daftar akun Portal SBU Kadin Indonesia</p>
            </div>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-2 pt-2">
              <div className={`w-3 h-3 rounded-full transition-colors ${currentStep === 1 ? 'bg-primary shadow-sm' : 'bg-muted-foreground/40'}`}></div> 
              <div className="w-10 h-0.5 bg-muted-foreground/30"></div>
              <div className={`w-3 h-3 rounded-full transition-colors ${currentStep === 2 ? 'bg-primary shadow-sm' : 'bg-muted-foreground/40'}`}></div> 
            </div>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              Langkah {currentStep} dari 2
            </p>
          </div>
          <div className="p-0"> 
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground dark:text-gray-200">
                      Nama Lengkap <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="name" 
                      placeholder="Masukkan nama lengkap" 
                      {...register('name')} 
                      className={`h-12 text-base rounded-xl border-2 transition-colors ${errors.name ? 'border-destructive focus:border-destructive' : 'border-border dark:border-gray-600 focus:border-primary dark:focus:border-primary-light'}`} 
                    />
                    {errors.name && <p className="text-sm text-destructive dark:text-red-400">{errors.name.message}</p>} 
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground dark:text-gray-200">
                        Email <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="contoh@email.com" 
                        {...register('email')} 
                        className={`h-12 text-base rounded-xl border-2 transition-colors ${errors.email ? 'border-destructive focus:border-destructive' : 'border-border dark:border-gray-600 focus:border-primary dark:focus:border-primary-light'}`} 
                      />
                      {errors.email && <p className="text-sm text-destructive dark:text-red-400">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-foreground dark:text-gray-200">
                        Nomor Telepon <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input 
                        id="phone" 
                        placeholder="08xxxxxxxxxx" 
                        onKeyPress={handleNumberInput} 
                        {...register('phone')} 
                        className={`h-12 text-base rounded-xl border-2 transition-colors ${errors.phone ? 'border-destructive focus:border-destructive' : 'border-border dark:border-gray-600 focus:border-primary dark:focus:border-primary-light'}`} 
                      />
                      {errors.phone && <p className="text-sm text-destructive dark:text-red-400">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground dark:text-gray-200">
                        Kata Sandi <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="Minimal 8 karakter" 
                          {...register('password', {
                            onChange: () => trigger('confirmPassword')
                          })} 
                          className={`h-12 text-base rounded-xl border-2 pr-12 transition-colors ${errors.password ? 'border-destructive focus:border-destructive' : 'border-border dark:border-gray-600 focus:border-primary dark:focus:border-primary-light'}`} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)} 
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary dark:hover:text-primary-light transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-sm text-destructive dark:text-red-400">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground dark:text-gray-200">
                        Konfirmasi Kata Sandi <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="relative">
                        <Input 
                          id="confirmPassword" 
                          type={showConfirmPassword ? 'text' : 'password'} 
                          placeholder="Ulangi kata sandi" 
                          {...register('confirmPassword', {
                            onChange: () => trigger('confirmPassword')
                          })} 
                          className={`h-12 text-base rounded-xl border-2 pr-12 transition-colors ${errors.confirmPassword ? 'border-destructive focus:border-destructive' : 'border-border dark:border-gray-600 focus:border-primary dark:focus:border-primary-light'}`} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary dark:hover:text-primary-light transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive dark:text-red-400">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    onClick={nextStep} 
                    className="w-full h-12 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
                  > 
                    Lanjutkan ke Data Perusahaan
                  </Button>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground dark:text-gray-200">
                      Nama Perusahaan <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Select 
                        onValueChange={value => setValue('businessEntityType', value, { shouldValidate: true })} 
                        value={watch('businessEntityType')}
                      >
                        <SelectTrigger className={`flex-none w-48 h-12 text-base rounded-xl border-2 transition-colors ${errors.businessEntityType ? 'border-destructive' : 'border-border dark:border-gray-600 focus:border-primary dark:focus:border-primary-light'}`}>
                          <SelectValue placeholder="Pilih bentuk perusahaan" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="PT">Perseroan Terbatas (PT)</SelectItem>
                          <SelectItem value="CV">CV</SelectItem>
                          <SelectItem value="Firma">Firma</SelectItem>
                          <SelectItem value="Koperasi">Koperasi</SelectItem>
                          <SelectItem value="Perum">Perum</SelectItem>
                          <SelectItem value="Perseorangan">Perseorangan</SelectItem>
                          <SelectItem value="Lainnya">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        id="companyName" 
                        placeholder="Masukkan Nama Perusahaan" 
                        {...register('companyName')} 
                        className={`flex-1 h-12 text-base rounded-xl border-2 transition-colors ${errors.companyName ? 'border-destructive focus:border-destructive' : 'border-border dark:border-gray-600 focus:border-primary dark:focus:border-primary-light'}`} 
                      />
                    </div>
                    {errors.businessEntityType && <p className="text-sm text-destructive dark:text-red-400">{errors.businessEntityType.message}</p>}
                    {errors.companyName && <p className="text-sm text-destructive dark:text-red-400">{errors.companyName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="npwp" className="text-sm font-medium text-foreground dark:text-gray-200">
                      NPWP <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="npwp"
                        placeholder="00.000.000.0-000.000"
                        value={watchedNpwp} 
                        onChange={handleNPWPChange} 
                        maxLength={20} 
                        className={`flex-1 h-12 text-base rounded-xl border-2 transition-colors ${errors.npwp ? 'border-destructive focus:border-destructive' : 'border-border dark:border-gray-600 focus:border-primary dark:focus:border-primary-light'}`}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={checkNpwpInDatabase} 
                        disabled={isCheckingNpwp || !!errors.npwp || !/^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/.test(watchedNpwp ?? '')} 
                        className="px-4 py-2 h-12 rounded-xl text-primary dark:text-primary-light border-primary hover:bg-primary/10 dark:hover:bg-primary-light/10 transition-colors"
                      >
                        {renderCheckStatusIcon(null, isCheckingNpwp)}
                        {!isCheckingNpwp && 'Check'}
                      </Button>
                    </div>
                    {errors.npwp && <p className="text-sm text-destructive dark:text-red-400">{errors.npwp.message}</p>}
                    {npwpCheckResult === 'found' && (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        {renderCheckStatusIcon(npwpCheckResult, isCheckingNpwp)} NPWP ini sudah terdaftar.
                      </p>
                    )}
                    {npwpCheckResult === 'not_found' && (
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        {renderCheckStatusIcon(npwpCheckResult, isCheckingNpwp)} NPWP tersedia.
                      </p>
                    )}
                    {npwpCheckResult === 'error' && (
                      <p className="text-sm text-destructive dark:text-red-400">Terjadi kesalahan saat memeriksa NPWP.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nib" className="text-sm font-medium text-foreground dark:text-gray-200">
                      NIB <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="nib" 
                        placeholder="1234567890123" 
                        value={watchedNib} 
                        onChange={handleNibChange} 
                        maxLength={16}
                        onKeyPress={handleNumberInput} 
                        className={`flex-1 h-12 text-base rounded-xl border-2 transition-colors ${errors.nib ? 'border-destructive focus:border-destructive' : 'border-border dark:border-gray-600 focus:border-primary dark:focus:border-primary-light'}`}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={checkNibInDatabase} 
                        disabled={isCheckingNib || !!errors.nib || (watchedNib ?? '').replace(/\D/g, '').length < 13} 
                        className="px-4 py-2 h-12 rounded-xl text-primary dark:text-primary-light border-primary hover:bg-primary/10 dark:hover:bg-primary-light/10 transition-colors"
                      >
                        {renderCheckStatusIcon(null, isCheckingNib)}
                        {!isCheckingNib && 'Check'}
                      </Button>
                    </div>
                    {errors.nib && <p className="text-sm text-destructive dark:text-red-400">{errors.nib.message}</p>}
                    {nibCheckResult === 'found' && (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        {renderCheckStatusIcon(nibCheckResult, isCheckingNib)} NIB ini sudah terdaftar.
                      </p>
                    )}
                    {nibCheckResult === 'not_found' && (
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        {renderCheckStatusIcon(nibCheckResult, isCheckingNib)} NIB tersedia.
                      </p>
                    )}
                    {nibCheckResult === 'error' && (
                      <p className="text-sm text-destructive dark:text-red-400">Terjadi kesalahan saat memeriksa NIB.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessType" className="text-sm font-medium text-foreground dark:text-gray-200">
                        Jenis Usaha <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select 
                        onValueChange={value => setValue('businessType', value, { shouldValidate: true })} 
                        value={watch('businessType')}
                      >
                        <SelectTrigger className={`h-11 text-base rounded-xl border-2 transition-colors ${errors.businessType ? 'border-destructive' : 'border-border dark:border-gray-600 focus:border-primary dark:focus:border-primary-light'}`}>
                          <SelectValue placeholder="Pilih Kategori Usaha" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="ADMINISTRASI PEMERINTAHAN, PERTAHANAN DAN JAMINAN SOSIAL WAJIB">ADMINISTRASI PEMERINTAHAN, PERTAHANAN DAN JAMINAN SOSIAL WAJIB</SelectItem>
                          <SelectItem value="AKTIVITAS BADAN INTERNASIONAL DAN BADAN EKSTRA INTERNASIONAL LAINNYA">AKTIVITAS BADAN INTERNASIONAL DAN BADAN EKSTRA INTERNASIONAL LAINNYA</SelectItem>
                          <SelectItem value="AKTIVITAS JASA LAINNYA">AKTIVITAS JASA LAINNYA</SelectItem>
                          <SelectItem value="AKTIVITAS KESEHATAN MANUSIA DAN AKTIVITAS SOSIAL">AKTIVITAS KESEHATAN MANUSIA DAN AKTIVITAS SOSIAL</SelectItem>
                          <SelectItem value="AKTIVITAS KEUANGAN DAN ASURANSI">AKTIVITAS KEUANGAN DAN ASURANSI</SelectItem>
                          <SelectItem value="AKTIVITAS PENYEWAAN DAN SEWA GUNA USAHA TANPA HAK OPSI, KETENAGAKERJAAN, AGEN PERJALANAN DAN PENUNJANG USAHA LAINNYA">AKTIVITAS PENYEWAAN DAN SEWA GUNA USAHA TANPA HAK OPSI, KETENAGAKERJAAN, AGEN PERJALANAN DAN PENUNJANG USAHA LAINNYA</SelectItem>
                          <SelectItem value="AKTIVITAS PROFESIONAL, ILMIAH DAN TEKNIS">AKTIVITAS PROFESIONAL, ILMIAH DAN TEKNIS</SelectItem>
                          <SelectItem value="AKTIVITAS RUMAH TANGGA SEBAGAI PEMBERI KERJA">AKTIVITAS RUMAH TANGGA SEBAGAI PEMBERI KERJA</SelectItem>
                          <SelectItem value="INDUSTRI PENGOLAHAN">INDUSTRI PENGOLAHAN</SelectItem>
                          <SelectItem value="INFORMASI DAN KOMUNIKASI">INFORMASI DAN KOMUNIKASI</SelectItem>
                          <SelectItem value="KESENIAN, HIBURAN DAN REKREASI">KESENIAN, HIBURAN DAN REKREASI</SelectItem>
                          <SelectItem value="PENDIDIKAN">PENDIDIKAN</SelectItem>
                          <SelectItem value="PENGADAAN LISTRIK, GAS, UAP/AIR PANAS DAN UDARA DINGIN">PENGADAAN LISTRIK, GAS, UAP/AIR PANAS DAN UDARA DINGIN</SelectItem>
                          <SelectItem value="PENGANGKUTAN DAN PERGUDANGAN">PENGANGKUTAN DAN PERGUDANGAN</SelectItem>
                          <SelectItem value="PENYEDIAAN AKOMODASI DAN PENYEDIAAN MAKAN MINUM">PENYEDIAAN AKOMODASI DAN PENYEDIAAN MAKAN MINUM</SelectItem>
                          <SelectItem value="PERDAGANGAN BESAR DAN ECERAN">PERDAGANGAN BESAR DAN ECERAN</SelectItem>
                          <SelectItem value="PERTAMBANGAN DAN PENGGALIAN">PERTAMBANGAN DAN PENGGALIAN</SelectItem>
                          <SelectItem value="PERTANIAN, KEHUTANAN DAN PERIKANAN">PERTANIAN, KEHUTANAN DAN PERIKANAN</SelectItem>
                          <SelectItem value="REAL ESTAT">REAL ESTAT</SelectItem>
                          <SelectItem value="TREATMENT AIR, TREATMENT AIR LIMBAH, TREATMENT DAN PEMULIHAN MATERIAL SAMPAH, DAN AKTIVITAS REMEDIASI">TREATMENT AIR, TREATMENT AIR LIMBAH, TREATMENT DAN PEMULIHAN MATERIAL SAMPAH, DAN AKTIVITAS REMEDIASI</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.businessType && <p className="text-sm text-destructive dark:text-red-400">{errors.businessType.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeCount" className="text-sm font-medium text-foreground dark:text-gray-200">
                        Jumlah Karyawan <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Select 
                        onValueChange={(value) => setValue('employeeCount', value, { shouldValidate: true })} 
                        value={watch('employeeCount')}
                      >
                        <SelectTrigger className={`h-12 text-base rounded-xl border-2 transition-colors ${errors.employeeCount ? 'border-destructive' : 'border-border dark:border-gray-600 focus:border-primary dark:focus:border-primary-light'}`}>
                          <SelectValue placeholder="Pilih jumlah karyawan" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="1-5">1-5 karyawan</SelectItem>
                          <SelectItem value="6-10">6-10 karyawan</SelectItem>
                          <SelectItem value="11-25">11-25 karyawan</SelectItem>
                          <SelectItem value="26-50">26-50 karyawan</SelectItem>
                          <SelectItem value="51-100">51-100 karyawan</SelectItem>
                          <SelectItem value="101-250">101-250 karyawan</SelectItem>
                          <SelectItem value="250+">Lebih dari 250 karyawan</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.employeeCount && <p className="text-sm text-destructive dark:text-red-400">{errors.employeeCount.message}</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      onCheckedChange={checked => setValue('termsAccepted', !!checked, { shouldValidate: true })} 
                      checked={termsAccepted} 
                      className={`border-2 ${errors.termsAccepted ? 'border-destructive' : 'border-primary dark:border-primary-light'} data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`} 
                    />
                    <Label htmlFor="terms" className="text-sm text-foreground dark:text-gray-200">
                      Saya Setuju dan Menerima{' '}
                      <span className="text-red-500 ml-1">*</span>
                      <span className="text-primary dark:text-primary-light underline cursor-pointer hover:opacity-80 transition-opacity">
                        Tampilkan Syarat & Ketentuan
                      </span>
                    </Label>
                  </div>
                  {errors.termsAccepted && <p className="text-sm text-destructive dark:text-red-400">{errors.termsAccepted.message}</p>}

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCurrentStep(1)} 
                      className="h-12 rounded-xl border-2 font-medium text-primary dark:text-primary-light border-primary hover:bg-primary/10 dark:hover:bg-primary-light/10 transition-colors"
                    >
                      Kembali
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={
                        isLoading || 
                        !termsAccepted || 
                        npwpCheckResult !== 'not_found' || 
                        nibCheckResult !== 'not_found' 
                      } 
                      className="h-12 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mendaftar...
                        </>
                      ) : 'Daftar'}
                    </Button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-sm dark:text-gray-300">
                Sudah punya akun? {' '}
                <Link to="/login" className="text-primary hover:text-primary-light font-semibold transition-colors">
                  Masuk sekarang
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary-dark to-blue-800 relative overflow-hidden items-center justify-center p-8">
        <div className="absolute inset-0 bg-black/10 z-0"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center text-primary-foreground space-y-8 max-w-md">
          <div className="space-y-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto"> 
              <span className="text-white font-extrabold text-4xl">KI</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold leading-tight tracking-wide">
                BADAN SERTIFIKASI KADIN
              </h1> 
              <p className="text-xl opacity-90 font-medium">Portal Sertifikasi Kadin</p> 
              <div className="w-20 h-1.5 bg-white/60 mx-auto rounded-full mt-4"></div> 
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-sm flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70">
              <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="2" strokeDasharray="5 5"/> 
              <path d="M30 50L45 65L70 35" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/> 
            </svg>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">BADAN SERTIFIKAT USAHA</h2> 
            <p className="text-white/80 text-sm max-w-xs mx-auto">Sistem terpadu untuk pengelolaan sertifikat badan usaha Kadin Indonesia</p>
          </div>
        </div>
      </div>
    </div>
  );
}