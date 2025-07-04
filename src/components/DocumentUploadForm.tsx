
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, FileText } from 'lucide-react';

const DocumentUploadForm = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-blue-900 mb-4 border-b border-blue-200 pb-2">
        Upload Dokumen Persyaratan
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Akta Pendirian Perusahaan *
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <Input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="aktaPendirian"
            />
            <Label htmlFor="aktaPendirian" className="cursor-pointer text-blue-600 hover:text-blue-800">
              Klik untuk upload atau drag & drop
            </Label>
            <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            NPWP Perusahaan *
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <Input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="npwpDoc"
            />
            <Label htmlFor="npwpDoc" className="cursor-pointer text-blue-600 hover:text-blue-800">
              Klik untuk upload atau drag & drop
            </Label>
            <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            NIB (Nomor Induk Berusaha) *
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <Input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="nibDoc"
            />
            <Label htmlFor="nibDoc" className="cursor-pointer text-blue-600 hover:text-blue-800">
              Klik untuk upload atau drag & drop
            </Label>
            <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            KTP Direktur *
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <Input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="ktpDirector"
            />
            <Label htmlFor="ktpDirector" className="cursor-pointer text-blue-600 hover:text-blue-800">
              Klik untuk upload atau drag & drop
            </Label>
            <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Surat Keterangan Domisili *
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <Input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="domisiliDoc"
            />
            <Label htmlFor="domisiliDoc" className="cursor-pointer text-blue-600 hover:text-blue-800">
              Klik untuk upload atau drag & drop
            </Label>
            <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Laporan Keuangan Terakhir
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <Input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="financialReport"
            />
            <Label htmlFor="financialReport" className="cursor-pointer text-blue-600 hover:text-blue-800">
              Klik untuk upload atau drag & drop
            </Label>
            <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Catatan Penting:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Dokumen yang bertanda (*) wajib diupload</li>
          <li>• Format file yang diterima: PDF, JPG, JPEG, PNG</li>
          <li>• Ukuran maksimal file: 5MB per dokumen</li>
          <li>• Pastikan dokumen jelas dan dapat dibaca</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentUploadForm;
