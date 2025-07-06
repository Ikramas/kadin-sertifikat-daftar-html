import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Send, Shield, Save, CheckCircle, Clock, Award, AlertCircle } from 'lucide-react';
import { submitSchema, SubmitData } from '@/lib/validationSchemas';
import { useFormContext } from '@/contexts/FormContext';
import { toast } from '@/hooks/use-toast';

interface SubmitSectionProps {
  onValidation?: (isValid: boolean) => void;
  onFinalSubmit?: () => void;
}

const SubmitSection: React.FC<SubmitSectionProps> = ({ onValidation, onFinalSubmit }) => {
  const { submitInfo, setSubmitInfo, companyInfo, directorInfo, applicationStatus, submitApplication } = useFormContext();
  const isDisabled = !applicationStatus.canEdit;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<SubmitData>({
    resolver: zodResolver(submitSchema),
    defaultValues: submitInfo,
    mode: 'onChange'
  });

  React.useEffect(() => {
    onValidation?.(isValid);
  }, [isValid, onValidation]);

  const watchedValues = watch();
  React.useEffect(() => {
    setSubmitInfo(watchedValues);
  }, [watchedValues, setSubmitInfo]);

  const onSubmit = (data: SubmitData) => {
    console.log('Final submission data:', {
      companyInfo,
      directorInfo,
      submitInfo: data
    });
    
    submitApplication();
    
    toast({
      title: "🎉 Aplikasi Berhasil Dikirim!",
      description: "Aplikasi sertifikat Anda telah berhasil dikirim. Anda akan menerima email konfirmasi dalam 1x24 jam.",
    });
    
    onFinalSubmit?.();
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Tersimpan",
      description: "Data Anda telah disimpan sebagai draft",
    });
  };

  if (applicationStatus.status !== 'draft' && !applicationStatus.canEdit) {
    return (
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
        
        <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
          <div className="flex items-center mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl mr-4 shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-800 to-emerald-900 bg-clip-text text-transparent">
                Aplikasi Telah Dikirim
              </h2>
              <p className="text-gray-600 mt-1">Terima kasih telah mengajukan aplikasi sertifikasi</p>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div className="p-4 rounded-2xl border-2 border-green-200 bg-green-50/30">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  ✓ Pernyataan kebenaran data telah disetujui
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border-2 border-green-200 bg-green-50/30">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  ✓ Kebijakan privasi telah disetujui
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border-2 border-green-200 bg-green-50/30">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  ✓ Izin komunikasi telah diberikan
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-2xl border-2 border-green-200 p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-2 rounded-xl mr-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Jaminan Keamanan Data
                </h4>
                <p className="text-sm text-green-700 mb-4">
                  Semua data yang Anda berikan akan dienkripsi dan disimpan dengan aman sesuai 
                  standar keamanan internasional. Data hanya akan digunakan untuk proses sertifikasi 
                  dan tidak akan dibagikan kepada pihak ketiga tanpa persetujuan.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center text-green-700">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>SSL 256-bit Encryption</span>
                  </div>
                  <div className="flex items-center text-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>ISO 27001 Certified</span>
                  </div>
                  <div className="flex items-center text-green-700">
                    <Award className="w-4 h-4 mr-2" />
                    <span>GDPR Compliant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-4 text-center">Tahapan Setelah Pengajuan</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="w-6 h-6" />
                </div>
                <h5 className="font-semibold text-blue-800 mb-1">Konfirmasi</h5>
                <p className="text-xs text-blue-600">Email konfirmasi dalam 1x24 jam</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h5 className="font-semibold text-yellow-800 mb-1">Review</h5>
                <p className="text-xs text-yellow-600">Proses review 3-5 hari kerja</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6" />
                </div>
                <h5 className="font-semibold text-green-800 mb-1">Sertifikat</h5>
                <p className="text-xs text-green-600">Sertifikat digital diterbitkan</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span className="font-semibold text-green-600">Langkah 4 dari 4 - Siap untuk diajukan!</span>
              <div className="flex space-x-1">
                <div className="w-8 h-1 bg-green-600 rounded-full"></div>
                <div className="w-8 h-1 bg-green-600 rounded-full"></div>
                <div className="w-8 h-1 bg-green-600 rounded-full"></div>
                <div className="w-8 h-1 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      
      <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
        <div className="flex items-center mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl mr-4 shadow-lg">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-800 to-emerald-900 bg-clip-text text-transparent">
              Persetujuan dan Pengajuan
            </h2>
            <p className="text-gray-600 mt-1">Langkah terakhir untuk mengirimkan aplikasi Anda</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6 mb-8">
            <div className="group/check flex items-start space-x-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all duration-300">
              <Checkbox 
                id="terms" 
                {...register('terms')}
                onCheckedChange={(checked) => setValue('terms', !!checked)}
                className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                disabled={isDisabled}
              />
              <div className="flex-1">
                <Label htmlFor="terms" className="text-sm leading-relaxed text-gray-700 cursor-pointer">
                  <span className="font-semibold text-gray-800">Pernyataan Kebenaran Data:</span> Saya menyatakan bahwa semua informasi yang saya berikan adalah benar dan akurat. 
                  Saya memahami bahwa memberikan informasi palsu dapat mengakibatkan penolakan aplikasi 
                  atau pencabutan sertifikat yang telah diterbitkan.
                </Label>
                {errors.terms && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span>{String(errors.terms.message)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="group/check flex items-start space-x-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-300">
              <Checkbox 
                id="privacy" 
                {...register('privacy')}
                onCheckedChange={(checked) => setValue('privacy', !!checked)}
                className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                disabled={isDisabled}
              />
              <div className="flex-1">
                <Label htmlFor="privacy" className="text-sm leading-relaxed text-gray-700 cursor-pointer">
                  <span className="font-semibold text-gray-800">Kebijakan Privasi:</span> Saya setuju dengan kebijakan privasi dan syarat & ketentuan KADIN Indonesia 
                  terkait penggunaan data pribadi dan perusahaan untuk proses sertifikasi.
                </Label>
                {errors.privacy && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span>{String(errors.privacy.message)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="group/check flex items-start space-x-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all duration-300">
              <Checkbox 
                id="contact" 
                {...register('contact')}
                onCheckedChange={(checked) => setValue('contact', !!checked)}
                className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                disabled={isDisabled}
              />
              <div className="flex-1">
                <Label htmlFor="contact" className="text-sm leading-relaxed text-gray-700 cursor-pointer">
                  <span className="font-semibold text-gray-800">Izin Komunikasi:</span> Saya memberikan izin kepada KADIN Indonesia untuk menghubungi saya melalui 
                  email atau telepon terkait proses aplikasi sertifikat ini.
                </Label>
                {errors.contact && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span>{String(errors.contact.message)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-8 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-2xl border-2 border-green-200 p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 p-2 rounded-xl mr-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Jaminan Keamanan Data
                </h4>
                <p className="text-sm text-green-700 mb-4">
                  Semua data yang Anda berikan akan dienkripsi dan disimpan dengan aman sesuai 
                  standar keamanan internasional. Data hanya akan digunakan untuk proses sertifikasi 
                  dan tidak akan dibagikan kepada pihak ketiga tanpa persetujuan.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center text-green-700">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>SSL 256-bit Encryption</span>
                  </div>
                  <div className="flex items-center text-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>ISO 27001 Certified</span>
                  </div>
                  <div className="flex items-center text-green-700">
                    <Award className="w-4 h-4 mr-2" />
                    <span>GDPR Compliant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button 
              type="button"
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={isDisabled}
              className="flex-1 h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-semibold text-base transition-all duration-300 group/btn disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
              Simpan Draft
            </Button>
            
            <Button 
              type="submit"
              disabled={!isValid || isDisabled}
              className="flex-1 h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
              Ajukan Sertifikat Sekarang
            </Button>
          </div>
        </form>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-4 text-center">Tahapan Setelah Pengajuan</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6" />
              </div>
              <h5 className="font-semibold text-blue-800 mb-1">Konfirmasi</h5>
              <p className="text-xs text-blue-600">Email konfirmasi dalam 1x24 jam</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h5 className="font-semibold text-yellow-800 mb-1">Review</h5>
              <p className="text-xs text-yellow-600">Proses review 3-5 hari kerja</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6" />
              </div>
              <h5 className="font-semibold text-green-800 mb-1">Sertifikat</h5>
              <p className="text-xs text-green-600">Sertifikat digital diterbitkan</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span className="font-semibold text-green-600">Langkah 4 dari 4 - Siap untuk diajukan!</span>
            <div className="flex space-x-1">
              <div className="w-8 h-1 bg-green-600 rounded-full"></div>
              <div className="w-8 h-1 bg-green-600 rounded-full"></div>
              <div className="w-8 h-1 bg-green-600 rounded-full"></div>
              <div className="w-8 h-1 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitSection;
