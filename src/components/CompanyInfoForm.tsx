
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, MapPin, Phone, Mail, Globe, Users, Calendar, Briefcase, AlertCircle } from 'lucide-react';
import { companyInfoSchema, CompanyInfoData } from '@/lib/validationSchemas';
import { useFormContext } from '@/contexts/FormContext';
import { toast } from '@/hooks/use-toast';

interface CompanyInfoFormProps {
  onValidation?: (isValid: boolean) => void;
}

const CompanyInfoForm: React.FC<CompanyInfoFormProps> = ({ onValidation }) => {
  const { companyInfo, setCompanyInfo, applicationStatus } = useFormContext();
  const isDisabled = !applicationStatus.canEdit;
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger
  } = useForm<CompanyInfoData>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: companyInfo,
    mode: 'onChange'
  });

  React.useEffect(() => {
    onValidation?.(isValid);
  }, [isValid, onValidation]);

  const watchedValues = watch();
  React.useEffect(() => {
    setCompanyInfo(watchedValues);
  }, [watchedValues, setCompanyInfo]);

  const onSubmit = (data: CompanyInfoData) => {
    setCompanyInfo(data);
    if (!isDisabled) {
      toast({
        title: "Data Tersimpan",
        description: "Informasi perusahaan berhasil disimpan",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex items-center mb-6">
        <div className="bg-blue-600 p-2 rounded-lg mr-3">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-blue-800">
            Informasi Perusahaan
          </h2>
          <p className="text-gray-600 text-sm">
            {isDisabled ? 'Data perusahaan yang telah disubmit' : 'Data lengkap perusahaan yang akan didaftarkan'}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName" className="flex items-center text-gray-700 font-medium mb-2">
                <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                Nama Perusahaan *
              </Label>
              <Input 
                id="companyName"
                {...register('companyName')}
                placeholder="Masukkan nama lengkap perusahaan"
                disabled={isDisabled}
                className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.companyName ? 'border-red-500' : ''
                }`}
              />
              {errors.companyName && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.companyName.message}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="companyType" className="flex items-center text-gray-700 font-medium mb-2">
                <Briefcase className="w-4 h-4 mr-2 text-purple-600" />
                Jenis Perusahaan *
              </Label>
              <Select 
                onValueChange={(value) => setValue('companyType', value)} 
                defaultValue={companyInfo.companyType}
                disabled={isDisabled}
              >
                <SelectTrigger className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.companyType ? 'border-red-500' : ''
                }`}>
                  <SelectValue placeholder="Pilih jenis perusahaan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">PT (Perseroan Terbatas)</SelectItem>
                  <SelectItem value="cv">CV (Commanditaire Vennootschap)</SelectItem>
                  <SelectItem value="ud">UD (Usaha Dagang)</SelectItem>
                  <SelectItem value="firma">Firma</SelectItem>
                  <SelectItem value="koperasi">Koperasi</SelectItem>
                </SelectContent>
              </Select>
              {errors.companyType && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.companyType.message}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="establishedYear" className="flex items-center text-gray-700 font-medium mb-2">
                <Calendar className="w-4 h-4 mr-2 text-green-600" />
                Tahun Berdiri *
              </Label>
              <Input 
                id="establishedYear"
                type="number"
                {...register('establishedYear', { valueAsNumber: true })}
                placeholder="Tahun perusahaan didirikan"
                disabled={isDisabled}
                className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.establishedYear ? 'border-red-500' : ''
                }`}
              />
              {errors.establishedYear && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.establishedYear.message}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="employeeCount" className="flex items-center text-gray-700 font-medium mb-2">
                <Users className="w-4 h-4 mr-2 text-orange-600" />
                Jumlah Karyawan *
              </Label>
              <Select 
                onValueChange={(value) => setValue('employeeCount', value)} 
                defaultValue={companyInfo.employeeCount}
                disabled={isDisabled}
              >
                <SelectTrigger className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.employeeCount ? 'border-red-500' : ''
                }`}>
                  <SelectValue placeholder="Pilih rentang jumlah karyawan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 orang</SelectItem>
                  <SelectItem value="11-50">11-50 orang</SelectItem>
                  <SelectItem value="51-100">51-100 orang</SelectItem>
                  <SelectItem value="101-500">101-500 orang</SelectItem>
                  <SelectItem value="500+">500+ orang</SelectItem>
                </SelectContent>
              </Select>
              {errors.employeeCount && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.employeeCount.message}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="address" className="flex items-center text-gray-700 font-medium mb-2">
                <MapPin className="w-4 h-4 mr-2 text-red-600" />
                Alamat Lengkap *
              </Label>
              <Textarea 
                id="address"
                {...register('address')}
                placeholder="Masukkan alamat lengkap perusahaan"
                disabled={isDisabled}
                className={`min-h-[100px] ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.address ? 'border-red-500' : ''
                }`}
              />
              {errors.address && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.address.message}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center text-gray-700 font-medium mb-2">
                <Phone className="w-4 h-4 mr-2 text-green-600" />
                Nomor Telepon *
              </Label>
              <Input 
                id="phone"
                {...register('phone')}
                placeholder="Masukkan nomor telepon perusahaan"
                disabled={isDisabled}
                className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.phone ? 'border-red-500' : ''
                }`}
              />
              {errors.phone && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.phone.message}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center text-gray-700 font-medium mb-2">
                <Mail className="w-4 h-4 mr-2 text-blue-600" />
                Email Perusahaan *
              </Label>
              <Input 
                id="email"
                type="email"
                {...register('email')}
                placeholder="Masukkan email resmi perusahaan"
                disabled={isDisabled}
                className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.email ? 'border-red-500' : ''
                }`}
              />
              {errors.email && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email.message}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="website" className="flex items-center text-gray-700 font-medium mb-2">
                <Globe className="w-4 h-4 mr-2 text-indigo-600" />
                Website (Opsional)
              </Label>
              <Input 
                id="website"
                {...register('website')}
                placeholder="https://www.perusahaan.co.id"
                disabled={isDisabled}
                className={`h-11 ${
                  isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${
                  errors.website ? 'border-red-500' : ''
                }`}
              />
              {errors.website && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.website.message}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Informasi Penting</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Pastikan semua data sesuai dengan dokumen resmi perusahaan</li>
                <li>• Nama perusahaan harus sama dengan yang tertera di akta pendirian</li>
                <li>• Email dan nomor telepon akan digunakan untuk komunikasi resmi</li>
                <li>• Data akan diverifikasi dengan dokumen yang akan diupload</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompanyInfoForm;
