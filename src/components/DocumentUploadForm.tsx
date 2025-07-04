
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { documentUploadSchema, DocumentUploadData } from '@/lib/validationSchemas';
import { useFormContext } from '@/contexts/FormContext';
import { toast } from '@/hooks/use-toast';

interface DocumentUploadFormProps {
  onValidation?: (isValid: boolean) => void;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({ onValidation }) => {
  const { documentUpload, setDocumentUpload } = useFormContext();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile>>({});
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<DocumentUploadData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: documentUpload,
    mode: 'onChange'
  });

  React.useEffect(() => {
    onValidation?.(isValid);
  }, [isValid, onValidation]);

  const watchedValues = watch();
  React.useEffect(() => {
    setDocumentUpload(watchedValues);
  }, [watchedValues, setDocumentUpload]);

  const handleFileUpload = (fieldName: string, files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Terlalu Besar",
          description: "Ukuran file maksimal 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Format File Tidak Valid",
          description: "Hanya file PDF, JPG, JPEG, dan PNG yang diperbolehkan",
          variant: "destructive",
        });
        return;
      }

      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      }));

      setValue(fieldName as keyof DocumentUploadData, files);
      
      toast({
        title: "File Berhasil Diupload",
        description: `${file.name} berhasil diupload`,
      });
    }
  };

  const removeFile = (fieldName: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fieldName];
      return newFiles;
    });
    setValue(fieldName as keyof DocumentUploadData, undefined);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  const requiredDocs = documents.filter(doc => doc.required);
  const uploadedRequiredCount = requiredDocs.filter(doc => uploadedFiles[doc.id]).length;
  const totalUploaded = Object.keys(uploadedFiles).length;

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
      
      <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {documents.map((doc) => (
            <div key={doc.id} className="group/upload relative">
              <Label className={`flex items-center text-gray-700 font-semibold mb-3 ${doc.color}`}>
                <doc.icon className="w-4 h-4 mr-2" />
                {doc.title} {doc.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {uploadedFiles[doc.id] ? (
                <div className={`relative border-2 ${doc.borderColor} rounded-2xl p-4 ${doc.bgColor} border-solid`}>
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <button
                      type="button"
                      onClick={() => removeFile(doc.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-800 truncate">{uploadedFiles[doc.id].name}</p>
                    <p className="text-gray-600">{formatFileSize(uploadedFiles[doc.id].size)}</p>
                  </div>
                </div>
              ) : (
                <div className={`relative border-3 border-dashed ${doc.borderColor} rounded-2xl p-6 text-center hover:border-opacity-60 transition-all duration-300 ${doc.bgColor} group-hover/upload:shadow-lg ${
                  errors[doc.id as keyof DocumentUploadData] ? 'border-red-500 bg-red-50' : ''
                }`}>
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
                      {...register(doc.id as keyof DocumentUploadData)}
                      onChange={(e) => handleFileUpload(doc.id, e.target.files)}
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
              )}
              
              {errors[doc.id as keyof DocumentUploadData] && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors[doc.id as keyof DocumentUploadData]?.message}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-red-800">Belum Upload</div>
            <div className="text-xs text-red-600">{requiredDocs.length - uploadedRequiredCount} dokumen wajib</div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-4 text-center">
            <Upload className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-yellow-800">Progress</div>
            <div className="text-xs text-yellow-600">{uploadedRequiredCount}/{requiredDocs.length} wajib</div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-green-800">Total Upload</div>
            <div className="text-xs text-green-600">{totalUploaded} dokumen</div>
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default DocumentUploadForm;
