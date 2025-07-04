
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const DocumentUploadForm = () => {
  const documents = [
    {
      id: 'aktaPendirian',
      title: 'Akta Pendirian Perusahaan',
      required: true,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'npwpDoc',
      title: 'NPWP Perusahaan',
      required: true,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'nibDoc',
      title: 'NIB (Nomor Induk Berusaha)',
      required: true,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'ktpDirector',
      title: 'KTP Direktur',
      required: true,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'domisiliDoc',
      title: 'Surat Keterangan Domisili',
      required: true,
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      id: 'financialReport',
      title: 'Laporan Keuangan Terakhir',
      required: false,
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ];

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      
      <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/50">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-2xl mr-4 shadow-lg">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-800 to-purple-900 bg-clip-text text-transparent">
              Upload Dokumen Persyaratan
            </h2>
            <p className="text-gray-600 mt-1">Upload semua dokumen yang diperlukan untuk verifikasi</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div key={doc.id} className="group/upload relative">
              <Label className={`flex items-center text-gray-700 font-semibold mb-3 ${doc.color}`}>
                <doc.icon className="w-4 h-4 mr-2" />
                {doc.title} {doc.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              <div className={`relative border-3 border-dashed ${doc.borderColor} rounded-2xl p-6 text-center hover:border-opacity-60 transition-all duration-300 ${doc.bgColor} group-hover/upload:shadow-lg`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-2xl"></div>
                
                <div className="relative z-10">
                  <div className={`w-16 h-16 mx-auto mb-4 ${doc.bgColor} rounded-2xl flex items-center justify-center shadow-lg group-hover/upload:scale-110 transition-transform duration-300`}>
                    <Upload className={`w-8 h-8 ${doc.color}`} />
                  </div>
                  
                  <Input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id={doc.id}
                  />
                  
                  <Label 
                    htmlFor={doc.id} 
                    className={`cursor-pointer ${doc.color} hover:opacity-80 transition-opacity font-semibold text-sm block mb-2`}
                  >
                    Klik untuk upload atau drag & drop
                  </Label>
                  
                  <p className="text-xs text-gray-500">
                    PDF, JPG, PNG (Max 5MB)
                  </p>
                  
                  {doc.required && (
                    <div className="mt-3 flex items-center justify-center text-xs text-red-600">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Wajib diisi
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upload status indicator */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-red-800">Belum Upload</div>
            <div className="text-xs text-red-600">6 dokumen</div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-4 text-center">
            <Upload className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-yellow-800">Sedang Upload</div>
            <div className="text-xs text-yellow-600">0 dokumen</div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-green-800">Berhasil Upload</div>
            <div className="text-xs text-green-600">0 dokumen</div>
          </div>
        </div>

        {/* Important notes */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-xl mr-4">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-3">Catatan Penting Upload Dokumen</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Dokumen bertanda (*) wajib diupload
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Format: PDF, JPG, JPEG, PNG
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Ukuran maksimal: 5MB per dokumen
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Pastikan dokumen jelas dan dapat dibaca
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Dokumen harus masih berlaku
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Scan dengan resolusi tinggi
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Langkah 3 dari 4</span>
            <div className="flex space-x-1">
              <div className="w-8 h-1 bg-purple-600 rounded-full"></div>
              <div className="w-8 h-1 bg-purple-600 rounded-full"></div>
              <div className="w-8 h-1 bg-purple-600 rounded-full"></div>
              <div className="w-8 h-1 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadForm;
