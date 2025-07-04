
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, MapPin, Phone, Mail, Globe, Calendar, FileText } from 'lucide-react';

const CompanyInfoForm = () => {
  return (
    <div className="group relative">
      {/* Background glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      
      <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/50">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-2xl mr-4 shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-blue-900 bg-clip-text text-transparent">
              Informasi Badan Usaha
            </h2>
            <p className="text-gray-600 mt-1">Lengkapi informasi dasar perusahaan Anda</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="group/field">
              <Label htmlFor="companyName" className="flex items-center text-gray-700 font-semibold mb-3">
                <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                Nama Badan Usaha *
              </Label>
              <Input 
                id="companyName" 
                placeholder="Masukkan nama lengkap badan usaha"
                className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-blue-300"
              />
            </div>

            <div className="group/field">
              <Label htmlFor="companyType" className="flex items-center text-gray-700 font-semibold mb-3">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Bentuk Badan Usaha *
              </Label>
              <Select>
                <SelectTrigger className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white/80 hover:bg-white group-hover/field:border-blue-300">
                  <SelectValue placeholder="Pilih bentuk badan usaha" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 shadow-2xl">
                  <SelectItem value="pt">PT (Perseroan Terbatas)</SelectItem>
                  <SelectItem value="cv">CV (Commanditaire Vennootschap)</SelectItem>
                  <SelectItem value="ud">UD (Usaha Dagang)</SelectItem>
                  <SelectItem value="koperasi">Koperasi</SelectItem>
                  <SelectItem value="yayasan">Yayasan</SelectItem>
                  <SelectItem value="firma">Firma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="group/field">
              <Label htmlFor="npwp" className="flex items-center text-gray-700 font-semibold mb-3">
                <FileText className="w-4 h-4 mr-2 text-green-600" />
                NPWP *
              </Label>
              <Input 
                id="npwp" 
                placeholder="00.000.000.0-000.000"
                className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-blue-300"
              />
            </div>

            <div className="group/field">
              <Label htmlFor="nib" className="flex items-center text-gray-700 font-semibold mb-3">
                <FileText className="w-4 h-4 mr-2 text-purple-600" />
                NIB (Nomor Induk Berusaha) *
              </Label>
              <Input 
                id="nib" 
                placeholder="Masukkan NIB"
                className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-blue-300"
              />
            </div>

            <div className="group/field">
              <Label htmlFor="establishDate" className="flex items-center text-gray-700 font-semibold mb-3">
                <Calendar className="w-4 h-4 mr-2 text-orange-600" />
                Tanggal Pendirian *
              </Label>
              <Input 
                id="establishDate" 
                type="date"
                className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-blue-300"
              />
            </div>

            <div className="group/field">
              <Label htmlFor="businessField" className="flex items-center text-gray-700 font-semibold mb-3">
                <Building2 className="w-4 h-4 mr-2 text-indigo-600" />
                Bidang Usaha *
              </Label>
              <Select>
                <SelectTrigger className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white/80 hover:bg-white group-hover/field:border-blue-300">
                  <SelectValue placeholder="Pilih bidang usaha" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 shadow-2xl">
                  <SelectItem value="perdagangan">Perdagangan</SelectItem>
                  <SelectItem value="manufaktur">Manufaktur</SelectItem>
                  <SelectItem value="jasa">Jasa</SelectItem>
                  <SelectItem value="konstruksi">Konstruksi</SelectItem>
                  <SelectItem value="pertanian">Pertanian</SelectItem>
                  <SelectItem value="teknologi">Teknologi Informasi</SelectItem>
                  <SelectItem value="transportasi">Transportasi</SelectItem>
                  <SelectItem value="pariwisata">Pariwisata</SelectItem>
                </SelectContent>
              </Select>
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
                placeholder="Masukkan alamat lengkap badan usaha"
                className="min-h-[120px] border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-blue-300 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group/field">
                <Label htmlFor="city" className="flex items-center text-gray-700 font-semibold mb-3">
                  <MapPin className="w-4 h-4 mr-2 text-green-600" />
                  Kota/Kabupaten *
                </Label>
                <Input 
                  id="city" 
                  placeholder="Kota/Kabupaten"
                  className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-blue-300"
                />
              </div>

              <div className="group/field">
                <Label htmlFor="postalCode" className="flex items-center text-gray-700 font-semibold mb-3">
                  <MapPin className="w-4 h-4 mr-2 text-purple-600" />
                  Kode Pos *
                </Label>
                <Input 
                  id="postalCode" 
                  placeholder="Kode pos"
                  className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-blue-300"
                />
              </div>
            </div>

            <div className="group/field">
              <Label htmlFor="province" className="flex items-center text-gray-700 font-semibold mb-3">
                <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                Provinsi *
              </Label>
              <Select>
                <SelectTrigger className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white/80 hover:bg-white group-hover/field:border-blue-300">
                  <SelectValue placeholder="Pilih provinsi" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 shadow-2xl">
                  <SelectItem value="jakarta">DKI Jakarta</SelectItem>
                  <SelectItem value="jabar">Jawa Barat</SelectItem>
                  <SelectItem value="jateng">Jawa Tengah</SelectItem>
                  <SelectItem value="jatim">Jawa Timur</SelectItem>
                  <SelectItem value="sumut">Sumatera Utara</SelectItem>
                  <SelectItem value="sumbar">Sumatera Barat</SelectItem>
                  <SelectItem value="bali">Bali</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group/field">
                <Label htmlFor="phone" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Phone className="w-4 h-4 mr-2 text-green-600" />
                  Nomor Telepon *
                </Label>
                <Input 
                  id="phone" 
                  placeholder="Nomor telepon"
                  className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-blue-300"
                />
              </div>

              <div className="group/field">
                <Label htmlFor="email" className="flex items-center text-gray-700 font-semibold mb-3">
                  <Mail className="w-4 h-4 mr-2 text-red-600" />
                  Email *
                </Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="Alamat email"
                  className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-blue-300"
                />
              </div>
            </div>

            <div className="group/field">
              <Label htmlFor="website" className="flex items-center text-gray-700 font-semibold mb-3">
                <Globe className="w-4 h-4 mr-2 text-indigo-600" />
                Website (Opsional)
              </Label>
              <Input 
                id="website" 
                placeholder="https://www.perusahaan-anda.com"
                className="h-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 bg-white/80 hover:bg-white group-hover/field:border-blue-300"
              />
            </div>
          </div>
        </div>

        {/* Progress indicator at bottom */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Langkah 1 dari 4</span>
            <div className="flex space-x-1">
              <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
              <div className="w-8 h-1 bg-gray-200 rounded-full"></div>
              <div className="w-8 h-1 bg-gray-200 rounded-full"></div>
              <div className="w-8 h-1 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoForm;
