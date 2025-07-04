
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const CompanyInfoForm = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2">
        Informasi Badan Usaha
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-gray-700 font-medium">
            Nama Badan Usaha *
          </Label>
          <Input 
            id="companyName" 
            placeholder="Masukkan nama lengkap badan usaha"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyType" className="text-gray-700 font-medium">
            Bentuk Badan Usaha *
          </Label>
          <Select>
            <SelectTrigger className="border-gray-300 focus:border-blue-500">
              <SelectValue placeholder="Pilih bentuk badan usaha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">PT (Perseroan Terbatas)</SelectItem>
              <SelectItem value="cv">CV (Commanditaire Vennootschap)</SelectItem>
              <SelectItem value="ud">UD (Usaha Dagang)</SelectItem>
              <SelectItem value="koperasi">Koperasi</SelectItem>
              <SelectItem value="yayasan">Yayasan</SelectItem>
              <SelectItem value="firma">Firma</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="npwp" className="text-gray-700 font-medium">
            NPWP *
          </Label>
          <Input 
            id="npwp" 
            placeholder="00.000.000.0-000.000"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nib" className="text-gray-700 font-medium">
            NIB (Nomor Induk Berusaha) *
          </Label>
          <Input 
            id="nib" 
            placeholder="Masukkan NIB"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="establishDate" className="text-gray-700 font-medium">
            Tanggal Pendirian *
          </Label>
          <Input 
            id="establishDate" 
            type="date"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessField" className="text-gray-700 font-medium">
            Bidang Usaha *
          </Label>
          <Select>
            <SelectTrigger className="border-gray-300 focus:border-blue-500">
              <SelectValue placeholder="Pilih bidang usaha" />
            </SelectTrigger>
            <SelectContent>
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

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="address" className="text-gray-700 font-medium">
            Alamat Lengkap *
          </Label>
          <Textarea 
            id="address" 
            placeholder="Masukkan alamat lengkap badan usaha"
            className="border-gray-300 focus:border-blue-500 min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="text-gray-700 font-medium">
            Kota/Kabupaten *
          </Label>
          <Input 
            id="city" 
            placeholder="Masukkan kota/kabupaten"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="province" className="text-gray-700 font-medium">
            Provinsi *
          </Label>
          <Select>
            <SelectTrigger className="border-gray-300 focus:border-blue-500">
              <SelectValue placeholder="Pilih provinsi" />
            </SelectTrigger>
            <SelectContent>
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

        <div className="space-y-2">
          <Label htmlFor="postalCode" className="text-gray-700 font-medium">
            Kode Pos *
          </Label>
          <Input 
            id="postalCode" 
            placeholder="Masukkan kode pos"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-gray-700 font-medium">
            Nomor Telepon *
          </Label>
          <Input 
            id="phone" 
            placeholder="Masukkan nomor telepon"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 font-medium">
            Email *
          </Label>
          <Input 
            id="email" 
            type="email"
            placeholder="Masukkan alamat email"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="text-gray-700 font-medium">
            Website (Opsional)
          </Label>
          <Input 
            id="website" 
            placeholder="Masukkan alamat website"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoForm;
