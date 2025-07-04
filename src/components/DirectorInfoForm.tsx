
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DirectorInfoForm = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2">
        Informasi Pimpinan/Direktur
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="directorName" className="text-gray-700 font-medium">
            Nama Lengkap Direktur *
          </Label>
          <Input 
            id="directorName" 
            placeholder="Masukkan nama lengkap direktur"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="directorPosition" className="text-gray-700 font-medium">
            Jabatan *
          </Label>
          <Select>
            <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="directorKtp" className="text-gray-700 font-medium">
            Nomor KTP *
          </Label>
          <Input 
            id="directorKtp" 
            placeholder="Masukkan nomor KTP"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="directorBirth" className="text-gray-700 font-medium">
            Tanggal Lahir *
          </Label>
          <Input 
            id="directorBirth" 
            type="date"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="directorPhone" className="text-gray-700 font-medium">
            Nomor Telepon *
          </Label>
          <Input 
            id="directorPhone" 
            placeholder="Masukkan nomor telepon"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="directorEmail" className="text-gray-700 font-medium">
            Email *
          </Label>
          <Input 
            id="directorEmail" 
            type="email"
            placeholder="Masukkan alamat email"
            className="border-gray-300 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default DirectorInfoForm;
