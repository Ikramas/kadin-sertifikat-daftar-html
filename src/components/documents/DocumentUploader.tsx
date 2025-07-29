// src/components/documents/DocumentUploader.tsx
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useErrorHandler } from '@/hooks/useErrorHandler'; // Import useErrorHandler

interface DocumentUploaderProps {
  documentType: string;
  label: string;
  required?: boolean;
  uploaded: boolean;
  uploading: boolean;
  error: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
  // Jika Anda ingin menampilkan nama file asli atau link unduhan di sini, Anda bisa menambahkannya
  originalFileName?: string; 
  fileDownloadUrl?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documentType,
  label,
  required = false,
  uploaded,
  uploading,
  error,
  onFileSelect,
  onRemove,
  disabled = false,
  originalFileName, 
  fileDownloadUrl,  
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { handleError } = useErrorHandler(); // Inisialisasi useErrorHandler

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      // Melakukan validasi dasar sebelum memanggil onFileSelect
      if (file.size > 5 * 1024 * 1024) {
        handleError(new Error('Ukuran file tidak boleh lebih dari 5MB.'), 'file_upload_size');
        return;
      }
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        handleError(new Error('Format file tidak valid. Hanya PDF, JPG, atau PNG.'), 'file_upload_format');
        return;
      }
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    if (!disabled && !uploading && !uploaded) { // Hanya izinkan klik jika belum diunggah dan tidak sedang diunggah
      fileInputRef.current?.click();
    } else if (uploaded && !disabled) {
      // Mungkin berikan feedback bahwa file sudah diunggah
      // handleWarning('Dokumen sudah diunggah. Gunakan tombol "Lihat Dokumen" atau "Hapus" untuk tindakan lebih lanjut.', 'Dokumen Sudah Ada');
    }
  };

  const getCardClasses = () => {
    let classes = "border-2 border-dashed transition-colors cursor-pointer ";
    
    if (disabled) {
      classes += "border-gray-200 bg-gray-50 cursor-not-allowed ";
    } else if (uploaded) {
      classes += "border-green-300 bg-green-50 ";
    } else if (error) {
      classes += "border-red-300 bg-red-50 ";
    } else if (dragOver) {
      classes += "border-primary bg-primary/5 ";
    } else {
      classes += "border-gray-300 hover:border-primary ";
    }
    
    return classes;
  };

  const getStatusIcon = () => {
    if (uploaded) {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    } else if (error) {
      return <AlertCircle className="w-6 h-6 text-red-600" />;
    } else if (uploading) {
      return <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
    } else {
      return <Upload className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (uploaded) {
      return originalFileName || "Dokumen berhasil diunggah";
    } else if (error) {
      return error;
    } else if (uploading) {
      return "Mengunggah dokumen...";
    } else {
      return "Klik atau drag & drop file di sini";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <Card
        className={getCardClasses()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-3">
            {getStatusIcon()}
            
            <div className="text-center">
              <p className="text-sm font-medium">{getStatusText()}</p>
              <p className="text-xs text-gray-500 mt-1">
                Format: PDF, JPG, PNG (Maks. 5MB)
              </p>
            </div>

            {uploading && (
              <div className="w-full max-w-xs">
                <Progress value={75} className="h-2" />
              </div>
            )}

            {uploaded && !disabled && (
              <div className="flex items-center space-x-2">
                {fileDownloadUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); 
                      window.open(fileDownloadUrl, '_blank');
                    }}
                  >
                    <File className="w-4 h-4 mr-2" />
                    Lihat Dokumen
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); 
                    onRemove();
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Hapus
                </Button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled || uploading || uploaded} // Dinonaktifkan jika sudah diunggah
          />
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};