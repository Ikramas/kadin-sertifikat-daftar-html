import React, { useEffect } from 'react';
import { DocumentUploader } from './DocumentUploader';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { Progress } from '@/components/ui/progress';

interface DocumentListProps {
  onDocumentsChange?: (uploadedDocuments: Array<{ documentType: string; backendId: string }>) => void;
  disabled?: boolean;
}

const REQUIRED_DOCUMENTS = [
  {
    type: 'ktp_pimpinan',
    label: 'KTP Pimpinan Perusahaan',
    required: true
  },
  {
    type: 'npwp_perusahaan',
    label: 'NPWP Perusahaan',
    required: true
  },
  {
    type: 'nib_perusahaan',
    label: 'NIB Perusahaan',
    required: true
  },
  {
    type: 'akta_pendirian',
    label: 'Akta Pendirian Perusahaan',
    required: true
  },
  {
    type: 'sk_kemenkumham',
    label: 'SK Kemenkumham',
    required: true
  },
  {
    type: 'domisili_perusahaan',
    label: 'Surat Domisili Perusahaan',
    required: true
  },
  {
    type: 'neraca_keuangan',
    label: 'Neraca Keuangan Terakhir',
    required: true
  },
  {
    type: 'laporan_laba_rugi',
    label: 'Laporan Laba Rugi',
    required: true
  },
  {
    type: 'rekening_koran',
    label: 'Rekening Koran 3 Bulan Terakhir',
    required: true
  }
];

export const DocumentList: React.FC<DocumentListProps> = ({
  onDocumentsChange,
  disabled = false
}) => {
  const {
    uploadStates,
    initializeDocument,
    uploadDocument,
    removeDocument,
    getDocumentState,
    getAllUploadedDocuments,
    areAllRequiredDocumentsUploaded
  } = useDocumentUpload({
    onUploadComplete: (documentType, backendId) => {
      // Notify parent component about changes
      const allUploaded = getAllUploadedDocuments();
      onDocumentsChange?.(allUploaded);
    }
  });

  // Initialize all documents
  useEffect(() => {
    REQUIRED_DOCUMENTS.forEach(doc => {
      initializeDocument(doc.type);
    });
  }, []);

  // Notify parent whenever upload states change
  useEffect(() => {
    const allUploaded = getAllUploadedDocuments();
    onDocumentsChange?.(allUploaded);
  }, [uploadStates, onDocumentsChange]);

  const handleFileSelect = async (documentType: string, file: File) => {
    await uploadDocument(documentType, file);
  };

  const handleRemove = (documentType: string) => {
    removeDocument(documentType);
  };

  const calculateProgress = () => {
    const totalDocuments = REQUIRED_DOCUMENTS.length;
    const uploadedCount = REQUIRED_DOCUMENTS.filter(doc => 
      getDocumentState(doc.type).uploaded
    ).length;
    return (uploadedCount / totalDocuments) * 100;
  };

  const getUploadedCount = () => {
    return REQUIRED_DOCUMENTS.filter(doc => 
      getDocumentState(doc.type).uploaded
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-blue-900">Progress Upload Dokumen</h3>
          <span className="text-sm text-blue-700">
            {getUploadedCount()}/{REQUIRED_DOCUMENTS.length} dokumen
          </span>
        </div>
        <Progress value={calculateProgress()} className="h-2" />
        <p className="text-xs text-blue-600 mt-2">
          Pastikan semua dokumen telah diunggah sebelum mengirim registrasi
        </p>
      </div>

      {/* Document Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const state = getDocumentState(doc.type);
          return (
            <DocumentUploader
              key={doc.type}
              documentType={doc.type}
              label={doc.label}
              required={doc.required}
              uploaded={state.uploaded}
              uploading={state.uploading}
              error={state.error}
              onFileSelect={(file) => handleFileSelect(doc.type, file)}
              onRemove={() => handleRemove(doc.type)}
              disabled={disabled}
            />
          );
        })}
      </div>

      {/* Upload Summary */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-2">Ringkasan Upload</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Dokumen:</span>
            <p className="font-medium">{REQUIRED_DOCUMENTS.length}</p>
          </div>
          <div>
            <span className="text-gray-600">Sudah Upload:</span>
            <p className="font-medium text-green-600">{getUploadedCount()}</p>
          </div>
          <div>
            <span className="text-gray-600">Belum Upload:</span>
            <p className="font-medium text-orange-600">
              {REQUIRED_DOCUMENTS.length - getUploadedCount()}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Progress:</span>
            <p className="font-medium text-blue-600">{Math.round(calculateProgress())}%</p>
          </div>
        </div>
      </div>

      {/* All Required Complete Check */}
      {areAllRequiredDocumentsUploaded(REQUIRED_DOCUMENTS.map(d => d.type)) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <p className="text-green-800 font-medium">
              Semua dokumen wajib telah berhasil diunggah!
            </p>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Anda dapat melanjutkan ke langkah berikutnya untuk mengirim registrasi.
          </p>
        </div>
      )}
    </div>
  );
};