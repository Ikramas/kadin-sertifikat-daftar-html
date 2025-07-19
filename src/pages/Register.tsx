import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Eye, EyeOff } from 'lucide-react';
const registerSchema = z.object({
  // User data
  name: z.string().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string(),
  // Company data
  companyName: z.string().min(1, 'Nama perusahaan wajib diisi'),
  npwp: z.string().min(15, 'NPWP tidak valid'),
  nib: z.string().min(1, 'NIB wajib diisi'),
  address: z.string().min(1, 'Alamat lengkap wajib diisi'),
  city: z.string().min(1, 'Kota wajib diisi'),
  postalCode: z.string().min(5, 'Kode pos tidak valid'),
  companyPhone: z.string().min(10, 'Telepon perusahaan minimal 10 digit'),
  companyEmail: z.string().email('Format email perusahaan tidak valid'),
  businessType: z.string().min(1, 'Jenis usaha wajib dipilih'),
  investmentCapital: z.string().min(1, 'Modal investasi wajib diisi'),
  employeeCount: z.string().min(1, 'Jumlah karyawan wajib diisi'),
  // Terms
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'Anda harus menyetujui syarat dan ketentuan'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak sesuai',
  path: ['confirmPassword']
});
type RegisterForm = z.infer<typeof registerSchema>;
export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register: registerUser
  } = useAuth();
  const {
    toast
  } = useToast();
  const { handleError, handleSuccess, handleValidationErrors } = useErrorHandler();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: {
      errors
    }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  // Format NPWP while typing
  const formatNPWP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{1})(\d{3})(\d{3})/, '$1.$2.$3.$4-$5.$6');
    return formatted;
  };
  const handleNPWPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNPWP(e.target.value);
    setValue('npwp', formatted);
  };

  // Only allow numbers for specific fields
  const handleNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }
  };
  const nextStep = async () => {
    if (currentStep === 1) {
      const step1Fields = ['name', 'email', 'phone', 'password', 'confirmPassword'] as const;
      const isValid = await trigger(step1Fields);
      if (!isValid) {
        handleValidationErrors(
          Object.keys(errors).reduce((acc, key) => {
            if (step1Fields.includes(key as any)) {
              acc[key] = errors[key as keyof typeof errors]?.message || '';
            }
            return acc;
          }, {} as Record<string, string>),
          'registration_step1'
        );
        return;
      }
    }
    setCurrentStep(2);
  };
  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      // Map form data to backend format
      const registrationData = {
        // User data
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
        // Company data 
        companyName: data.companyName,
        npwp: data.npwp,
        nib: data.nib,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        companyPhone: data.companyPhone,
        companyEmail: data.companyEmail,
        businessType: data.businessType,
        investmentValue: data.investmentCapital, // Note: mapping to backend field name
        employeeCount: data.employeeCount,
        termsAccepted: data.termsAccepted
      };

      const result = await registerUser(registrationData);
      
      handleSuccess(
        'Kode OTP telah dikirim ke email Anda. Silakan periksa kotak masuk email Anda.',
        'Pendaftaran Berhasil'
      );
      
      // Redirect to OTP verification page with email parameter
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      
    } catch (error: any) {
      handleError(error, 'registration', {
        email: data.email,
        step: 'registration_submit'
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Register Form */}
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
              <CardTitle className="text-2xl lg:text-3xl font-bold text-primary">Bergabung</CardTitle>
              <p className="text-muted-foreground text-sm lg:text-base">Daftar akun Portal SBU Kadin Indonesia</p>
            </div>
            
            {/* Step indicator */}
            <div className="flex items-center justify-center space-x-2 pt-2">
              <div className={`w-3 h-3 rounded-full transition-colors ${currentStep === 1 ? 'bg-primary' : 'bg-muted'}`}></div>
              <div className="w-8 h-0.5 bg-muted"></div>
              <div className={`w-3 h-3 rounded-full transition-colors ${currentStep === 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Langkah {currentStep} dari 2
            </p>
          </CardHeader>
          <CardContent className="p-6 lg:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {currentStep === 1 && <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">Nama Lengkap</Label>
                    <Input id="name" placeholder="Masukkan nama lengkap" {...register('name')} className={`h-12 text-base rounded-xl border-2 transition-all duration-200 ${errors.name ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                    <Input id="email" type="email" placeholder="contoh@email.com" {...register('email')} className={`h-12 text-base rounded-xl border-2 transition-all duration-200 ${errors.email ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`} />
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-foreground">Nomor Telepon</Label>
                    <Input id="phone" placeholder="08xxxxxxxxxx" onKeyPress={handleNumberInput} {...register('phone')} className={`h-12 text-base rounded-xl border-2 transition-all duration-200 ${errors.phone ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`} />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Minimal 8 karakter" {...register('password')} className={`h-12 text-base rounded-xl border-2 pr-12 transition-all duration-200 ${errors.password ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Konfirmasi Password</Label>
                    <div className="relative">
                      <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Ulangi password" {...register('confirmPassword')} className={`h-12 text-base rounded-xl border-2 pr-12 transition-all duration-200 ${errors.confirmPassword ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                  </div>

                  <Button type="button" onClick={nextStep} className="w-full h-12 text-base font-semibold rounded-xl bg-primary hover:bg-primary-light transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Lanjutkan ke Data Perusahaan
                  </Button>
                </>}

              {currentStep === 2 && <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nama Perusahaan</Label>
                    <Input id="companyName" placeholder="PT. Contoh Perusahaan" {...register('companyName')} className={errors.companyName ? 'border-destructive' : ''} />
                    {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="npwp">NPWP</Label>
                    <Input id="npwp" placeholder="00.000.000.0-000.000" onChange={handleNPWPChange} maxLength={20} className={errors.npwp ? 'border-destructive' : ''} />
                    {errors.npwp && <p className="text-sm text-destructive">{errors.npwp.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nib">NIB</Label>
                    <Input id="nib" placeholder="1234567890123" onKeyPress={handleNumberInput} {...register('nib')} className={errors.nib ? 'border-destructive' : ''} />
                    {errors.nib && <p className="text-sm text-destructive">{errors.nib.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Jenis Usaha</Label>
                    <Select onValueChange={value => setValue('businessType', value)}>
                      <SelectTrigger className={errors.businessType ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Pilih jenis usaha" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="konstruksi">Konstruksi</SelectItem>
                        <SelectItem value="perdagangan">Perdagangan</SelectItem>
                        <SelectItem value="manufaktur">Manufaktur</SelectItem>
                        <SelectItem value="jasa">Jasa</SelectItem>
                        <SelectItem value="teknologi">Teknologi</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.businessType && <p className="text-sm text-destructive">{errors.businessType.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat Lengkap</Label>
                    <Input id="address" placeholder="Jl. Contoh No. 123" {...register('address')} className={errors.address ? 'border-destructive' : ''} />
                    {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Kota</Label>
                      <Input id="city" placeholder="Jakarta" {...register('city')} className={errors.city ? 'border-destructive' : ''} />
                      {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Kode Pos</Label>
                      <Input id="postalCode" placeholder="12345" onKeyPress={handleNumberInput} {...register('postalCode')} className={errors.postalCode ? 'border-destructive' : ''} />
                      {errors.postalCode && <p className="text-sm text-destructive">{errors.postalCode.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Telepon Perusahaan</Label>
                      <Input id="companyPhone" placeholder="021-12345678" onKeyPress={handleNumberInput} {...register('companyPhone')} className={errors.companyPhone ? 'border-destructive' : ''} />
                      {errors.companyPhone && <p className="text-sm text-destructive">{errors.companyPhone.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Email Perusahaan</Label>
                      <Input id="companyEmail" type="email" placeholder="info@perusahaan.com" {...register('companyEmail')} className={errors.companyEmail ? 'border-destructive' : ''} />
                      {errors.companyEmail && <p className="text-sm text-destructive">{errors.companyEmail.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="investmentCapital">Modal Investasi</Label>
                      <Input id="investmentCapital" placeholder="1000000000" onKeyPress={handleNumberInput} {...register('investmentCapital')} className={errors.investmentCapital ? 'border-destructive' : ''} />
                      {errors.investmentCapital && <p className="text-sm text-destructive">{errors.investmentCapital.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeCount">Jumlah Karyawan</Label>
                      <Input id="employeeCount" placeholder="50" onKeyPress={handleNumberInput} {...register('employeeCount')} className={errors.employeeCount ? 'border-destructive' : ''} />
                      {errors.employeeCount && <p className="text-sm text-destructive">{errors.employeeCount.message}</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" onCheckedChange={checked => setValue('termsAccepted', !!checked)} />
                    <Label htmlFor="terms" className="text-sm">
                      Saya Setuju dan Menerima{' '}
                      <span className="text-primary underline cursor-pointer">
                        Tampilkan Syarat & Ketentuan
                      </span>
                    </Label>
                  </div>
                  {errors.termsAccepted && <p className="text-sm text-destructive">{errors.termsAccepted.message}</p>}

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="h-12 rounded-xl border-2 font-medium">
                      Kembali
                    </Button>
                    <Button type="submit" disabled={isLoading} className="h-12 font-semibold rounded-xl bg-primary hover:bg-primary-light transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      {isLoading ? 'Mendaftar...' : 'Daftar'}
                    </Button>
                  </div>
                </>}
            </form>

            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-sm">
                Sudah punya akun? {' '}
                <Link to="/login" className="text-primary hover:text-primary-light font-semibold transition-colors">
                  Masuk sekarang
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
              <h2 className="text-2xl font-bold">BADAN SERTIFIKAT USAHA</h2>
              <p className="text-white/80 text-sm max-w-xs mx-auto">
                Bergabunglah dengan ribuan perusahaan yang telah terdaftar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>;
}