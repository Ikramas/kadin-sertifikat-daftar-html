import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, MapPin, Phone, Mail, DollarSign, Users } from 'lucide-react';

interface CompanyDataStepProps {
  form: UseFormReturn<any>;
  onPrevious: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const BUSINESS_TYPES = [
  { value: 'pt', label: 'PT (Perseroan Terbatas)' },
  { value: 'cv', label: 'CV (Commanditaire Vennootschap)' },
  { value: 'ud', label: 'UD (Usaha Dagang)' },
  { value: 'fa', label: 'FA (Firma)' },
  { value: 'koperasi', label: 'Koperasi' },
  { value: 'yayasan', label: 'Yayasan' },
  { value: 'perkumpulan', label: 'Perkumpulan' },
];

const EMPLOYEE_COUNTS = [
  { value: '1-5', label: '1-5 karyawan' },
  { value: '6-10', label: '6-10 karyawan' },
  { value: '11-25', label: '11-25 karyawan' },
  { value: '26-50', label: '26-50 karyawan' },
  { value: '51-100', label: '51-100 karyawan' },
  { value: '101-250', label: '101-250 karyawan' },
  { value: '250+', label: 'Lebih dari 250 karyawan' },
];

export const CompanyDataStep: React.FC<CompanyDataStepProps> = ({
  form,
  onPrevious,
  onSubmit,
  isLoading = false
}) => {
  const { register, formState: { errors }, setValue, watch, trigger } = form;
  
  const termsAccepted = watch('termsAccepted');

  const validateAndSubmit = async () => {
    const isValid = await trigger();
    if (isValid) {
      onSubmit();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Langkah 2: Data Perusahaan
        </CardTitle>
        <p className="text-gray-600">
          Lengkapi informasi perusahaan Anda untuk melanjutkan proses registrasi
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Company Basic Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium">
              Nama Perusahaan *
            </Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="companyName"
                type="text"
                placeholder="PT. Contoh Perusahaan"
                className="pl-10"
                {...register('companyName')}
              />
            </div>
            {errors.companyName && (
              <p className="text-sm text-red-600">
                {typeof errors.companyName.message === 'string' ? errors.companyName.message : 'Field ini wajib diisi'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessType" className="text-sm font-medium">
              Jenis Usaha *
            </Label>
            <Select
              onValueChange={(value) => setValue('businessType', value)}
              defaultValue=""
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis usaha" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.businessType && (
              <p className="text-sm text-red-600">
                {typeof errors.businessType.message === 'string' ? errors.businessType.message : 'Field ini wajib diisi'}
              </p>
            )}
          </div>
        </div>

        {/* Legal Documents */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="npwp" className="text-sm font-medium">
              NPWP Perusahaan *
            </Label>
            <Input
              id="npwp"
              type="text"
              placeholder="XX.XXX.XXX.X-XXX.XXX"
              {...register('npwp')}
            />
            {errors.npwp && (
              <p className="text-sm text-red-600">
                {typeof errors.npwp.message === 'string' ? errors.npwp.message : 'Field ini wajib diisi'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nib" className="text-sm font-medium">
              NIB (Nomor Induk Berusaha) *
            </Label>
            <Input
              id="nib"
              type="text"
              placeholder="XXXXXXXXXXXXXXX"
              {...register('nib')}
            />
            {errors.nib && (
              <p className="text-sm text-red-600">
                {typeof errors.nib.message === 'string' ? errors.nib.message : 'Field ini wajib diisi'}
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Alamat Lengkap Perusahaan *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                id="address"
                placeholder="Jl. Contoh No. 123, RT/RW 01/02"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('address')}
              />
            </div>
            {errors.address && (
              <p className="text-sm text-red-600">
                {typeof errors.address.message === 'string' ? errors.address.message : 'Field ini wajib diisi'}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">
                Kota *
              </Label>
              <Input
                id="city"
                type="text"
                placeholder="Jakarta"
                {...register('city')}
              />
              {errors.city && (
                <p className="text-sm text-red-600">
                  {typeof errors.city.message === 'string' ? errors.city.message : 'Field ini wajib diisi'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-sm font-medium">
                Kode Pos *
              </Label>
              <Input
                id="postalCode"
                type="text"
                placeholder="12345"
                {...register('postalCode')}
              />
              {errors.postalCode && (
                <p className="text-sm text-red-600">
                  {typeof errors.postalCode.message === 'string' ? errors.postalCode.message : 'Field ini wajib diisi'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="companyPhone" className="text-sm font-medium">
              Telepon Perusahaan *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="companyPhone"
                type="tel"
                placeholder="021-XXXXXXXX"
                className="pl-10"
                {...register('companyPhone')}
              />
            </div>
            {errors.companyPhone && (
              <p className="text-sm text-red-600">
                {typeof errors.companyPhone.message === 'string' ? errors.companyPhone.message : 'Field ini wajib diisi'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyEmail" className="text-sm font-medium">
              Email Perusahaan *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="companyEmail"
                type="email"
                placeholder="info@perusahaan.com"
                className="pl-10"
                {...register('companyEmail')}
              />
            </div>
            {errors.companyEmail && (
              <p className="text-sm text-red-600">
                {typeof errors.companyEmail.message === 'string' ? errors.companyEmail.message : 'Field ini wajib diisi'}
              </p>
            )}
          </div>
        </div>

        {/* Business Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="investmentCapital" className="text-sm font-medium">
              Modal Investasi *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="investmentCapital"
                type="text"
                placeholder="Rp 1.000.000.000"
                className="pl-10"
                {...register('investmentCapital')}
              />
            </div>
            {errors.investmentCapital && (
              <p className="text-sm text-red-600">
                {typeof errors.investmentCapital.message === 'string' ? errors.investmentCapital.message : 'Field ini wajib diisi'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="employeeCount" className="text-sm font-medium">
              Jumlah Karyawan *
            </Label>
            <Select
              onValueChange={(value) => setValue('employeeCount', value)}
              defaultValue=""
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jumlah karyawan" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEE_COUNTS.map((count) => (
                  <SelectItem key={count.value} value={count.value}>
                    {count.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeCount && (
              <p className="text-sm text-red-600">
                {typeof errors.employeeCount.message === 'string' ? errors.employeeCount.message : 'Field ini wajib diisi'}
              </p>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="bg-gray-50 border rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="termsAccepted"
              checked={termsAccepted}
              onCheckedChange={(checked) => setValue('termsAccepted', checked)}
              className="mt-1"
            />
            <div className="space-y-2">
              <Label htmlFor="termsAccepted" className="text-sm font-medium">
                Persetujuan Syarat dan Ketentuan *
              </Label>
              <p className="text-sm text-gray-600">
                Saya menyetujui{' '}
                <a href="#" className="text-primary hover:underline">
                  syarat dan ketentuan
                </a>{' '}
                serta{' '}
                <a href="#" className="text-primary hover:underline">
                  kebijakan privasi
                </a>{' '}
                BSKI Portal. Saya memahami bahwa data yang saya berikan akan digunakan
                untuk proses verifikasi dan sertifikasi.
              </p>
            </div>
          </div>
          {errors.termsAccepted && (
            <p className="text-sm text-red-600 mt-2">
              {typeof errors.termsAccepted.message === 'string' ? errors.termsAccepted.message : 'Anda harus menyetujui syarat dan ketentuan'}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isLoading}
          >
            Kembali
          </Button>
          
          <Button
            type="button"
            onClick={validateAndSubmit}
            disabled={isLoading || !termsAccepted}
            className="px-8"
          >
            {isLoading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};