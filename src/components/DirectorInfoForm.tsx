
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
  const { directorInfo, setDirectorInfo, applicationStatus } = useFormContext();
  const isDisabled = !applicationStatus.canEdit;
  
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
    if (!isDisabled) {
      toast({
        title: "Data Tersimpan",
        description: "Informasi direktur berhasil disimpan",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex items-center mb-6">
        <div className="bg-green-600 p-2 rounded-lg mr-3">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-green-800">
            Informasi Pimpinan/Direktur
          </h2>
          <p className="text-gray-600 text-sm">
            {isDisabled ? 'Data pimpinan yang telah disubmit' : 'Data lengkap pimpinan atau direktur perusahaan'}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="directorName" className="flex items-center text-gray-700 font-medium mb-2">
                <User className="w-4 h-4 mr-2 text-blue-600" />
                Nama Lengkap Direktur *
              </Label>
              <Input 
                id="directorName"
                {...register('directorName')}
                placeholder="Masukkan nama lengkap direktur"
                disabled={isDisabled}
                className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.directorName ? 'border-red-500' : ''
                }`}
              />
              {errors.directorName && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.directorName.message}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="directorPosition" className="flex items-center text-gray-700 font-medium mb-2">
                <Briefcase className="w-4 h-4 mr-2 text-purple-600" />
                Jabatan *
              </Label>
              <Select 
                onValueChange={(value) => setValue('directorPosition', value)} 
                defaultValue={directorInfo.directorPosition}
                disabled={isDisabled}
              >
                <SelectTrigger className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.directorPosition ? 'border-red-500' : ''
                }`}>
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direktur">Direktur Utama</SelectItem>
                  <SelectItem value="presdir">Presiden Direktur</SelectItem>
                  <SelectItem value="komisaris">Komisaris Utama</SelectItem>
                  <SelectItem value="pemilik">Pemilik</SelectItem>
                  <SelectItem value="ceo">CEO</SelectItem>
                </SelectContent>
              </Select>
              {errors.directorPosition && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.directorPosition.message}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="directorKtp" className="flex items-center text-gray-700 font-medium mb-2">
                <CreditCard className="w-4 h-4 mr-2 text-orange-600" />
                Nomor KTP *
              </Label>
              <Input 
                id="directorKtp"
                {...register('directorKtp')}
                placeholder="Masukkan nomor KTP (16 digit)"
                maxLength={16}
                disabled={isDisabled}
                className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.directorKtp ? 'border-red-500' : ''
                }`}
              />
              {errors.directorKtp && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.directorKtp.message}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="directorBirth" className="flex items-center text-gray-700 font-medium mb-2">
                <Calendar className="w-4 h-4 mr-2 text-red-600" />
                Tanggal Lahir *
              </Label>
              <Input 
                id="directorBirth"
                type="date"
                {...register('directorBirth')}
                disabled={isDisabled}
                className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.directorBirth ? 'border-red-500' : ''
                }`}
              />
              {errors.directorBirth && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.directorBirth.message}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="directorPhone" className="flex items-center text-gray-700 font-medium mb-2">
                <Phone className="w-4 h-4 mr-2 text-green-600" />
                Nomor Telepon *
              </Label>
              <Input 
                id="directorPhone"
                {...register('directorPhone')}
                placeholder="Masukkan nomor telepon aktif"
                disabled={isDisabled}
                className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.directorPhone ? 'border-red-500' : ''
                }`}
              />
              {errors.directorPhone && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.directorPhone.message}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="directorEmail" className="flex items-center text-gray-700 font-medium mb-2">
                <Mail className="w-4 h-4 mr-2 text-blue-600" />
                Email *
              </Label>
              <Input 
                id="directorEmail"
                type="email"
                {...register('directorEmail')}
                placeholder="Masukkan alamat email aktif"
                disabled={isDisabled}
                className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.directorEmail ? 'border-red-500' : ''
                }`}
              />
              {errors.directorEmail && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.directorEmail.message}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">Informasi Penting</h4>
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
  );
};

export default DirectorInfoForm;
