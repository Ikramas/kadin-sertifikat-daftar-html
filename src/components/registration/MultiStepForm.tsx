import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserDataStep } from './UserDataStep';
import { CompanyDataStep } from './CompanyDataStep';
import { Progress } from '@/components/ui/progress';

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

interface MultiStepFormProps {
  onSubmit: (data: RegisterForm) => Promise<void>;
  isLoading?: boolean;
}

const STEPS = [
  { id: 1, title: 'Data Pengguna', description: 'Informasi pribadi Anda' },
  { id: 2, title: 'Data Perusahaan', description: 'Informasi perusahaan Anda' }
];

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  onSubmit,
  isLoading = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      termsAccepted: false
    }
  });

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const data = form.getValues();
    await onSubmit(data);
  };

  const getProgressPercentage = () => {
    return (currentStep / STEPS.length) * 100;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header with Progress */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Registrasi BSKI Portal
            </h1>
            <p className="text-gray-600">
              Bergabunglah dengan platform sertifikasi Badan Usaha Kadin Indonesia
            </p>
          </div>

          {/* Step Indicator */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                      ${currentStep >= step.id 
                        ? 'bg-primary border-primary text-white' 
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                      }
                    `}
                  >
                    {currentStep > step.id ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  
                  <div className="ml-4 text-left">
                    <p className={`font-medium ${currentStep >= step.id ? 'text-primary' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>

                  {index < STEPS.length - 1 && (
                    <div className={`
                      flex-1 h-0.5 mx-8 transition-colors
                      ${currentStep > step.id ? 'bg-primary' : 'bg-gray-300'}
                    `} />
                  )}
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{Math.round(getProgressPercentage())}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <UserDataStep
              form={form}
              onNext={handleNext}
              isLoading={isLoading}
            />
          )}
          
          {currentStep === 2 && (
            <CompanyDataStep
              form={form}
              onPrevious={handlePrevious}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Footer */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <p className="text-sm text-gray-500">
            Sudah punya akun?{' '}
            <a href="/login" className="text-primary hover:underline font-medium">
              Masuk di sini
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};