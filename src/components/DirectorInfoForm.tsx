
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, CreditCard, Calendar, Phone, Mail, Briefcase, AlertCircle } from 'lucide-react';
import { directorInfoSchema, DirectorInfoData } from '@/lib/validationSchemas';
import { useFormContext } from '@/contexts/FormContext';
import { toast } from '@/hooks/use-toast';

interface DirectorInfoFormProps {
  onValidation?: (isValid: boolean) => void;
}

const DirectorInfoForm: React.FC<DirectorInfoFormProps> = ({ onValidation }) => {
  const { directorInfo, setDirectorInfo } = useFormContext();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<DirectorInfoData>({
    resolver: zodResolver(directorInfoSchema),
    defaultValues: directorInfo,
    mode: 'onChange'
  });

  React.useEffect(() => {
    onValidation?.(isValid);
  }, [isValid, onValidation]);

  const watchedValues = watch();
  React.useEffect(() => {
    setDirectorInfo(watchedValues);
  }, [watchedValues, setDirectorInfo]);

  const onSubmit = (data: DirectorInfoData) => {
    setDirectorInfo(data);
    toast({
      title: "Data Tersimpan",
      description: "Informasi direktur berhasil disimpan",
    });
  };

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      
      <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-2xl mr-4 shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-800 to-green-900 bg-clip-text text-transparent">
              Informasi Pimpinan/Direktur
            </h2>
            <p className="text-gray-600 mt-1">Data lengkap pimpinan atau direktur perusahaan</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="group/field">
                <Label htmlFor="directorName" className="flex items-center text-gray-700 font-semibold mb-3">
                  <User className="w-4 h-4 mr-2 text-blue-600" />
                  Nama Lengkap Direktur *
                </Label>
                <Input 
                  id="directorName"
                  {...register('directorName')}
                  placeholder="Masukkan nama lengkap direktur"
                  className={`h-12 border-2 rounded-xl transition-all duration-300 bg-white/80 hover:bg-white ${
                    errors.directorName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
                />
                {errors.directorName && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.directorName.message}
                  </div>
                )}
              </div>

              <div className="group/field">
                <Label htmlFor="directorPosition" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Briefcase className="w-4 h-4 mr-2 text-purple-600" />
                  Jabatan *
                </Label>
                <Select onValueChange={(value) => setValue('directorPosition', value)} defaultValue={directorInfo.directorPosition}>
                  <SelectTrigger className={`h-12 border-2 rounded-xl bg-white/80 hover:bg-white ${
                    errors.directorPosition ? 'border-red-500' : 'border-gray-200'
                  }`}>
                    <SelectValue placeholder="Pilih jabatan" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-2xl">
                    <SelectItem value="direktur">Direktur Utama</SelectItem>
                    <SelectItem value="presdir">Presiden Direktur</SelectItem>
                    <SelectItem value="komisaris">Komisaris Utama</SelectItem>
                    <SelectItem value="pemilik">Pemilik</SelectItem>
                    <SelectItem value="ceo">CEO</SelectItem>
                  </SelectContent>
                </Select>
                {errors.directorPosition && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.directorPosition.message}
                  </div>
                )}
              </div>

              <div className="group/field">
                <Label htmlFor="directorKtp" className="flex items-center text-gray-700 font-semibold mb-3">
                  <CreditCard className="w-4 h-4 mr-2 text-orange-600" />
                  Nomor KTP *
                </Label>
                <Input 
                  id="directorKtp"
                  {...register('directorKtp')}
                  placeholder="Masukkan nomor KTP (16 digit)"
                  maxLength={16}
                  className={`h-12 border-2 rounded-xl transition-all duration-300 bg-white/80 hover:bg-white ${
                    errors.directorKtp ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
                />
                {errors.directorKtp && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.directorKtp.message}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="group/field">
                <Label htmlFor="directorBirth" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Calendar className="w-4 h-4 mr-2 text-red-600" />
                  Tanggal Lahir *
                </Label>
                <Input 
                  id="directorBirth"
                  type="date"
                  {...register('directorBirth')}
                  className={`h-12 border-2 rounded-xl transition-all duration-300 bg-white/80 hover:bg-white ${
                    errors.directorBirth ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
                />
                {errors.directorBirth && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.directorBirth.message}
                  </div>
                )}
              </div>

              <div className="group/field">
                <Label htmlFor="directorPhone" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Phone className="w-4 h-4 mr-2 text-green-600" />
                  Nomor Telepon *
                </Label>
                <Input 
                  id="directorPhone"
                  {...register('directorPhone')}
                  placeholder="Masukkan nomor telepon aktif"
                  className={`h-12 border-2 rounded-xl transition-all duration-300 bg-white/80 hover:bg-white ${
                    errors.directorPhone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
                />
                {errors.directorPhone && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.directorPhone.message}
                  </div>
                )}
              </div>

              <div className="group/field">
                <Label htmlFor="directorEmail" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  Email *
                </Label>
                <Input 
                  id="directorEmail"
                  type="email"
                  {...register('directorEmail')}
                  placeholder="Masukkan alamat email aktif"
                  className={`h-12 border-2 rounded-xl transition-all duration-300 bg-white/80 hover:bg-white ${
                    errors.directorEmail ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
                />
                {errors.directorEmail && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.directorEmail.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-6">
            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-xl mr-4">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-2">Informasi Penting</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Pastikan data direktur sesuai dengan dokumen resmi</li>
                  <li>• Email dan nomor telepon akan digunakan untuk komunikasi</li>
                  <li>• Nomor KTP harus valid dan masih berlaku</li>
                  <li>• Data akan diverifikasi dengan dokumen yang diupload</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DirectorInfoForm;
