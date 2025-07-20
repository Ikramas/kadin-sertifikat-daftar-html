import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';

interface UserDataStepProps {
  form: UseFormReturn<any>;
  onNext: () => void;
  isLoading?: boolean;
}

export const UserDataStep: React.FC<UserDataStepProps> = ({
  form,
  onNext,
  isLoading = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, formState: { errors }, trigger, getValues } = form;

  const validateStep = async () => {
    const fieldsToValidate = ['name', 'email', 'phone', 'password', 'confirmPassword'];
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      onNext();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Langkah 1: Data Pengguna
        </CardTitle>
        <p className="text-gray-600">
          Silakan isi data pribadi Anda dengan lengkap dan benar
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Nama Lengkap *
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="name"
              type="text"
              placeholder="Masukkan nama lengkap Anda"
              className="pl-10"
              {...register('name')}
            />
          </div>
          {errors.name && (
            <p className="text-sm text-red-600">
              {typeof errors.name.message === 'string' ? errors.name.message : 'Field ini wajib diisi'}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Alamat Email *
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="email"
              type="email"
              placeholder="contoh@email.com"
              className="pl-10"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">
              {typeof errors.email.message === 'string' ? errors.email.message : 'Field ini wajib diisi'}
            </p>
          )}
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Nomor Telepon *
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="phone"
              type="tel"
              placeholder="08XXXXXXXXXX"
              className="pl-10"
              {...register('phone')}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-red-600">
              {typeof errors.phone.message === 'string' ? errors.phone.message : 'Field ini wajib diisi'}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password *
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimal 8 karakter"
              className="pl-10 pr-10"
              {...register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">
              {typeof errors.password.message === 'string' ? errors.password.message : 'Field ini wajib diisi'}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Konfirmasi Password *
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Ulangi password"
              className="pl-10 pr-10"
              {...register('confirmPassword')}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">
              {typeof errors.confirmPassword.message === 'string' ? errors.confirmPassword.message : 'Field ini wajib diisi'}
            </p>
          )}
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Persyaratan Password:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Minimal 8 karakter</li>
            <li>• Gunakan kombinasi huruf, angka, dan simbol</li>
            <li>• Hindari penggunaan informasi pribadi</li>
          </ul>
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="button"
            onClick={validateStep}
            disabled={isLoading}
            className="px-8"
          >
            Lanjut ke Data Perusahaan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};