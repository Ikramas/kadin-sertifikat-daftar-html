
import React, { useState, useEffect } from 'react';
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
  const { documentUpload, setDocumentUpload, uploadedFiles, setUploadedFiles, applicationStatus } = useFormContext();
  const [localFiles, setLocalFiles] = useState<Record<string, UploadedFile>>({});
  const isDisabled = !applicationStatus.canEdit;
  
  const {
    register,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<DocumentUploadData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: documentUpload,
    mode: 'onChange'
  });

  const watchedValues = watch();

  useEffect(() => {
    onValidation?.(isValid);
  }, [isValid, onValidation]);

  useEffect(() => {
    setDocumentUpload(watchedValues);
  }, [watchedValues, setDocumentUpload]);

  const handleFileUpload = (fieldName: string, files: FileList | null) => {
    if (isDisabled || !files || !files[0]) return;

    const file = files[0];
    
    // Validasi ukuran file (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Terlalu Besar",
        description: "Ukuran file maksimal 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validasi tipe file
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Format File Tidak Valid",
        description: "Hanya file PDF, JPG, JPEG, dan PNG yang diperbolehkan",
        variant: "destructive",
      });
      return;
    }

    const fileData = {
      name: file.name,
      size: file.size,
      type: file.type
    };

    setLocalFiles((prev) => ({
      ...prev,
      [fieldName]: fileData
    }));

    setUploadedFiles((prev) => ({
      ...prev,
      [fieldName]: {
        name: file.name,
        url: `https://example.com/documents/${fieldName}/${file.name}`,
        size: file.size
      }
    }));

    setValue(fieldName as keyof DocumentUploadData, file);
    
    toast({
      title: "File Berhasil Diupload",
      description: `${file.name} berhasil diupload`,
    });
  };

  const removeFile = (fieldName: string) => {
    if (isDisabled) return;

    setLocalFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[fieldName];
      return newFiles;
    });

    setUploadedFiles((prev) => {
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'npwpDoc',
      title: 'NPWP Perusahaan',
      required: true,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'nibDoc',
      title: 'NIB (Nomor Induk Berusaha)',
      required: true,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'ktpDirector',
      title: 'KTP Direktur',
      required: true,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'domisiliDoc',
      title: 'Surat Keterangan Domisili',
      required: true,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      id: 'financialReport',
      title: 'Laporan Keuangan Terakhir',
      required: false,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ];

  const requiredDocs = documents.filter(doc => doc.required);
  const uploadedRequiredCount = requiredDocs.filter(doc => localFiles[doc.id] || uploadedFiles[doc.id]).length;
  const totalUploaded = Object.keys(localFiles).length + Object.keys(uploadedFiles).length;

  return (
    <div className="bg-white rounded-3xl shadow-xl p-4 md:p-6 border">
      <div className="flex items-center mb-4">
        <div className="bg-purple-600 p-2 rounded-xl mr-3">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold text-purple-800">
            Upload Dokumen Persyaratan
          </h2>
          <p className="text-gray-600 text-sm">
            {isDisabled ? 'Dokumen yang telah diupload' : 'Upload semua dokumen yang diperlukan'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {documents.map((doc) => {
          const hasFile = localFiles[doc.id] || uploadedFiles[doc.id];
          const fileData = localFiles[doc.id] || uploadedFiles[doc.id];

          return (
            <div key={doc.id} className="relative">
              <Label className={`flex items-center text-sm font-semibold mb-2 ${doc.color}`}>
                <FileText className="w-4 h-4 mr-2" />
                {doc.title} {doc.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {hasFile ? (
                <div className={`border-2 ${doc.borderColor} rounded-xl p-3 ${doc.bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    {!isDisabled && (
                      <button
                        type="button"
                        onClick={() => removeFile(doc.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-800 truncate">
                      {fileData?.name}
                    </p>
                    <p className="text-gray-600">
                      {formatFileSize(fileData?.size || 0)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`border-2 border-dashed ${doc.borderColor} rounded-xl p-3 text-center ${doc.bgColor} ${
                  errors[doc.id as keyof DocumentUploadData] ? 'border-red-500 bg-red-50' : ''
                } ${isDisabled ? 'opacity-50' : 'hover:border-opacity-60'}`}>
                  <div className={`w-10 h-10 mx-auto mb-2 ${doc.bgColor} rounded-lg flex items-center justify-center`}>
                    <Upload className={`w-5 h-5 ${doc.color}`} />
                  </div>
                  
                  {!isDisabled && (
                    <>
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
                        className={`cursor-pointer ${doc.color} hover:opacity-80 font-semibold text-sm block mb-1`}
                      >
                        Klik untuk upload
                      </Label>
                      
                      <p className="text-xs text-gray-500">
                        PDF, JPG, PNG (Max 5MB)
                      </p>
                    </>
                  )}
                  
                  {doc.required && !isDisabled && (
                    <div className="mt-2 flex items-center justify-center text-xs text-red-600">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Wajib diisi
                    </div>
                  )}

                  {isDisabled && (
                    <p className="text-sm text-gray-500">
                      Belum ada file
                    </p>
                  )}
                </div>
              )}
              
              {errors[doc.id as keyof DocumentUploadData] && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>{String(errors[doc.id as keyof DocumentUploadData]?.message)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
          <AlertCircle className="w-4 h-4 text-red-600 mx-auto mb-1" />
          <div className="text-xs font-semibold text-red-800">Belum Upload</div>
          <div className="text-xs text-red-600">{requiredDocs.length - uploadedRequiredCount}</div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
          <Upload className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
          <div className="text-xs font-semibold text-yellow-800">Progress</div>
          <div className="text-xs text-yellow-600">{uploadedRequiredCount}/{requiredDocs.length}</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
          <CheckCircle className="w-4 h-4 text-green-600 mx-auto mb-1" />
          <div className="text-xs font-semibold text-green-800">Total</div>
          <div className="text-xs text-green-600">{totalUploaded}</div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start">
          <div className="bg-blue-100 p-1 rounded mr-2">
            <FileText className="w-3 h-3 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-1 text-sm">Catatan Penting</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-blue-700">
              <div className="space-y-1">
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                  <span>Dokumen (*) wajib diupload</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                  <span>Format: PDF, JPG, JPEG, PNG</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                  <span>Ukuran maksimal: 5MB</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                  <span>Dokumen jelas dan terbaca</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                  <span>Dokumen masih berlaku</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                  <span>Scan resolusi tinggi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadForm;
