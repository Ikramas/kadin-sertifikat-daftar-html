
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Send, Shield } from 'lucide-react';

const SubmitSection = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2">
        Persetujuan dan Pengajuan
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox id="terms" className="mt-1" />
          <Label htmlFor="terms" className="text-sm leading-relaxed text-gray-700">
            Saya menyatakan bahwa semua informasi yang saya berikan adalah benar dan akurat. 
            Saya memahami bahwa memberikan informasi palsu dapat mengakibatkan penolakan aplikasi 
            atau pencabutan sertifikat yang telah diterbitkan.
          </Label>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox id="privacy" className="mt-1" />
          <Label htmlFor="privacy" className="text-sm leading-relaxed text-gray-700">
            Saya setuju dengan kebijakan privasi dan syarat & ketentuan KADIN Indonesia 
            terkait penggunaan data pribadi dan perusahaan untuk proses sertifikasi.
          </Label>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox id="contact" className="mt-1" />
          <Label htmlFor="contact" className="text-sm leading-relaxed text-gray-700">
            Saya memberikan izin kepada KADIN Indonesia untuk menghubungi saya melalui 
            email atau telepon terkait proses aplikasi sertifikat ini.
          </Label>
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800">Keamanan Data</h4>
            <p className="text-sm text-green-700 mt-1">
              Semua data yang Anda berikan akan dienkripsi dan disimpan dengan aman sesuai 
              standar keamanan internasional. Data hanya akan digunakan untuk proses sertifikasi 
              dan tidak akan dibagikan kepada pihak ketiga tanpa persetujuan.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <Button 
          variant="outline" 
          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Simpan Draft
        </Button>
        <Button 
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Send className="w-4 h-4 mr-2" />
          Ajukan Sertifikat
        </Button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Setelah pengajuan, Anda akan menerima email konfirmasi dalam 1x24 jam.
          <br />
          Proses review biasanya memakan waktu 3-5 hari kerja.
        </p>
      </div>
    </div>
  );
};

export default SubmitSection;
