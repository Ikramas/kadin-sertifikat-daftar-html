
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
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      
      <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-2xl mr-4 shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-blue-900 bg-clip-text text-transparent">
              Informasi Perusahaan
            </h2>
            <p className="text-gray-600 mt-1">
              {isDisabled ? 'Data perusahaan yang telah disubmit' : 'Data lengkap perusahaan yang akan didaftarkan'}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="group/field">
                <Label htmlFor="companyName" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                  Nama Perusahaan *
                </Label>
                <Input 
                  id="companyName"
                  {...register('companyName')}
                  placeholder="Masukkan nama lengkap perusahaan"
                  disabled={isDisabled}
                  className={`h-12 border-2 rounded-xl transition-all duration-300 ${
                    isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/80 hover:bg-white'
                  } ${
                    errors.companyName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {errors.companyName && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.companyName.message}
                  </div>
                )}
              </div>

              <div className="group/field">
                <Label htmlFor="companyType" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Briefcase className="w-4 h-4 mr-2 text-purple-600" />
                  Jenis Perusahaan *
                </Label>
                <Select 
                  onValueChange={(value) => setValue('companyType', value)} 
                  defaultValue={companyInfo.companyType}
                  disabled={isDisabled}
                >
                  <SelectTrigger className={`h-12 border-2 rounded-xl ${
                    isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/80 hover:bg-white'
                  } ${
                    errors.companyType ? 'border-red-500' : 'border-gray-200'
                  }`}>
                    <SelectValue placeholder="Pilih jenis perusahaan" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-2xl">
                    <SelectItem value="pt">PT (Perseroan Terbatas)</SelectItem>
                    <SelectItem value="cv">CV (Commanditaire Vennootschap)</SelectItem>
                    <SelectItem value="ud">UD (Usaha Dagang)</SelectItem>
                    <SelectItem value="firma">Firma</SelectItem>
                    <SelectItem value="koperasi">Koperasi</SelectItem>
                  </SelectContent>
                </Select>
                {errors.companyType && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.companyType.message}
                  </div>
                )}
              </div>

              <div className="group/field">
                <Label htmlFor="establishedYear" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Calendar className="w-4 h-4 mr-2 text-green-600" />
                  Tahun Berdiri *
                </Label>
                <Input 
                  id="establishedYear"
                  type="number"
                  {...register('establishedYear', { valueAsNumber: true })}
                  placeholder="Tahun perusahaan didirikan"
                  disabled={isDisabled}
                  className={`h-12 border-2 rounded-xl transition-all duration-300 ${
                    isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/80 hover:bg-white'
                  } ${
                    errors.establishedYear ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {errors.establishedYear && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.establishedYear.message}
                  </div>
                )}
              </div>

              <div className="group/field">
                <Label htmlFor="employeeCount" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Users className="w-4 h-4 mr-2 text-orange-600" />
                  Jumlah Karyawan *
                </Label>
                <Select 
                  onValueChange={(value) => setValue('employeeCount', value)} 
                  defaultValue={companyInfo.employeeCount}
                  disabled={isDisabled}
                >
                  <SelectTrigger className={`h-12 border-2 rounded-xl ${
                    isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/80 hover:bg-white'
                  } ${
                    errors.employeeCount ? 'border-red-500' : 'border-gray-200'
                  }`}>
                    <SelectValue placeholder="Pilih rentang jumlah karyawan" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 shadow-2xl">
                    <SelectItem value="1-10">1-10 orang</SelectItem>
                    <SelectItem value="11-50">11-50 orang</SelectItem>
                    <SelectItem value="51-100">51-100 orang</SelectItem>
                    <SelectItem value="101-500">101-500 orang</SelectItem>
                    <SelectItem value="500+">500+ orang</SelectItem>
                  </SelectContent>
                </Select>
                {errors.employeeCount && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.employeeCount.message}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="group/field">
                <Label htmlFor="address" className="flex items-center text-gray-700 font-semibold mb-3">
                  <MapPin className="w-4 h-4 mr-2 text-red-600" />
                  Alamat Lengkap *
                </Label>
                <Textarea 
                  id="address"
                  {...register('address')}
                  placeholder="Masukkan alamat lengkap perusahaan"
                  disabled={isDisabled}
                  className={`min-h-[120px] border-2 rounded-xl transition-all duration-300 ${
                    isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/80 hover:bg-white'
                  } ${
                    errors.address ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {errors.address && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.address.message}
                  </div>
                )}
              </div>

              <div className="group/field">
                <Label htmlFor="phone" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Phone className="w-4 h-4 mr-2 text-green-600" />
                  Nomor Telepon *
                </Label>
                <Input 
                  id="phone"
                  {...register('phone')}
                  placeholder="Masukkan nomor telepon perusahaan"
                  disabled={isDisabled}
                  className={`h-12 border-2 rounded-xl transition-all duration-300 ${
                    isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/80 hover:bg-white'
                  } ${
                    errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {errors.phone && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.phone.message}
                  </div>
                )}
              </div>

              <div className="group/field">
                <Label htmlFor="email" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                  Email Perusahaan *
                </Label>
                <Input 
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="Masukkan email resmi perusahaan"
                  disabled={isDisabled}
                  className={`h-12 border-2 rounded-xl transition-all duration-300 ${
                    isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/80 hover:bg-white'
                  } ${
                    errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {errors.email && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email.message}
                  </div>
                )}
              </div>

              <div className="group/field">
                <Label htmlFor="website" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Globe className="w-4 h-4 mr-2 text-indigo-600" />
                  Website (Opsional)
                </Label>
                <Input 
                  id="website"
                  {...register('website')}
                  placeholder="https://www.perusahaan.co.id"
                  disabled={isDisabled}
                  className={`h-12 border-2 rounded-xl transition-all duration-300 ${
                    isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/80 hover:bg-white'
                  } ${
                    errors.website ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {errors.website && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.website.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-xl mr-4">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Informasi Penting</h4>
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
    </div>
  );
};

export default CompanyInfoForm;
