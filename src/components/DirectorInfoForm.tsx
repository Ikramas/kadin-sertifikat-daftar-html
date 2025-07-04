import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, CreditCard, Calendar, Phone, Mail, Briefcase } from 'lucide-react';

const DirectorInfoForm = () => {
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="group/field">
              <Label htmlFor="directorName" className="flex items-center text-gray-700 font-semibold mb-3">
                <User className="w-4 h-4 mr-2 text-blue-600" />
                Nama Lengkap Direktur *
              </Label>
              <Input 
                id="directorName" 
                placeholder="Masukkan nama lengkap direktur"
                className="h-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-green-300"
              />
            </div>

            <div className="group/field">
              <Label htmlFor="directorPosition" className="flex items-center text-gray-700 font-semibold mb-3">
                <Briefcase className="w-4 h-4 mr-2 text-purple-600" />
                Jabatan *
              </Label>
              <Select>
                <SelectTrigger className="h-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 bg-white/80 hover:bg-white group-hover/field:border-green-300">
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
            </div>

            <div className="group/field">
              <Label htmlFor="directorKtp" className="flex items-center text-gray-700 font-semibold mb-3">
                <CreditCard className="w-4 h-4 mr-2 text-orange-600" />
                Nomor KTP *
              </Label>
              <Input 
                id="directorKtp" 
                placeholder="Masukkan nomor KTP (16 digit)"
                className="h-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-green-300"
              />
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
                className="h-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-green-300"
              />
            </div>

            <div className="group/field">
              <Label htmlFor="directorPhone" className="flex items-center text-gray-700 font-semibold mb-3">
                <Phone className="w-4 h-4 mr-2 text-green-600" />
                Nomor Telepon *
              </Label>
              <Input 
                id="directorPhone" 
                placeholder="Masukkan nomor telepon aktif"
                className="h-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-green-300"
              />
            </div>

            <div className="group/field">
              <Label htmlFor="directorEmail" className="flex items-center text-gray-700 font-semibold mb-3">
                <Mail className="w-4 h-4 mr-2 text-blue-600" />
                Email *
              </Label>
              <Input 
                id="directorEmail" 
                type="email"
                placeholder="Masukkan alamat email aktif"
                className="h-12 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-green-300"
              />
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
      </div>
    </div>
  );
};

export default DirectorInfoForm;
