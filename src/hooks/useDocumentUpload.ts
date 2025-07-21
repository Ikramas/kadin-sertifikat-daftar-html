import { useState, useCallback, useEffect } from 'react'; 
import { useErrorHandler } from './useErrorHandler';
import { DocumentUploadState } from '@/types/company'; 

interface UseDocumentUploadProps {
  onUploadComplete?: (documentType: string, backendId: string) => void;
}

export const useDocumentUpload = ({ onUploadComplete }: UseDocumentUploadProps = {}) => {
  const [uploadStates, setUploadStates] = useState<DocumentUploadState>({});
  const { handleError, handleSuccess } = useErrorHandler();

  const initializeDocument = useCallback((documentType: string, initialData?: { uploaded: boolean; backendId: string | null; fileUrl?: string; original_name?: string; }) => {
    setUploadStates(prev => ({
      ...prev,
      [documentType]: {
        file: null,
        uploaded: initialData?.uploaded || false,
        uploading: false,
        backendId: initialData?.backendId || null,
        fileUrl: initialData?.fileUrl,
        original_name: initialData?.original_name, 
        error: null
      }
    }));
  }, []); 

  const validateFile = (file: File): string | null => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return 'Ukuran file tidak boleh lebih dari 5MB';
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return 'Format file harus PDF, JPG, atau PNG';
    }

    return null;
  };

  const uploadDocument = async (documentType: string, file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadStates(prev => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          error: validationError
        }
      }));
      handleError(new Error(validationError), 'file_upload');
      return false;
    }

    setUploadStates(prev => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        file,
        uploading: true,
        error: null
      }
    }));

    try {
      const csrfResponse = await fetch('/backend/api/auth/csrf-token.php', {
        method: 'GET', 
        credentials: 'include' 
      });
      const csrfData = await csrfResponse.json();

      if (csrfData.status !== 'success' || !csrfData.data.csrf_token) { 
        throw new Error(csrfData.message || 'Gagal mendapatkan token keamanan terbaru.');
      }
      const csrfToken = csrfData.data.csrf_token;

      const formData = new FormData();
      formData.append('document', file); 
      formData.append('document_type', documentType);
      formData.append('category', 'sbu_application'); // Kategori untuk dokumen SBU
      formData.append('csrf_token', csrfToken); 

      const token = localStorage.getItem('token'); 
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      }

      const uploadResponse = await fetch('/backend/api/documents/upload.php', {
        method: 'POST',
        credentials: 'include', 
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfToken 
        },
        body: formData
      });

      const uploadData = await uploadResponse.json();

      if (uploadData.status !== 'success') { 
        throw new Error(uploadData.message || 'Gagal mengunggah dokumen');
      }

      setUploadStates(prev => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          uploaded: true,
          uploading: false,
          backendId: uploadData.data.document.id, 
          fileUrl: uploadData.data.document.file_url, 
          original_name: uploadData.data.document.original_name, 
          error: null
        }
      }));

      handleSuccess(`Dokumen ${documentType} berhasil diunggah`);
      onUploadComplete?.(documentType, uploadData.data.document.id); 
      return true;

    } catch (error: any) {
      setUploadStates(prev => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          uploading: false,
          uploaded: false,
          error: error.message
        }
      }));

      handleError(error, 'file_upload', { documentType });
      return false;
    }
  };

  const removeDocument = (documentType: string) => {
    setUploadStates(prev => ({
      ...prev,
      [documentType]: {
        file: null,
        uploaded: false,
        uploading: false,
        backendId: null,
        fileUrl: undefined,
        original_name: undefined,
        error: null
      }
    }));
  };

  const getDocumentState = (documentType: string) => {
    return uploadStates[documentType] || {
      file: null,
      uploaded: false,
      uploading: false,
      backendId: null,
      fileUrl: undefined,
      original_name: undefined,
      error: null
    };
  };

  const getAllUploadedDocuments = () => {
    return Object.entries(uploadStates)
      .filter(([_, state]) => state.uploaded && state.backendId)
      .map(([documentType, state]) => ({
        documentType,
        backendId: state.backendId!,
        fileUrl: state.fileUrl, 
        original_name: state.original_name 
      }));
  };

  const areAllRequiredDocumentsUploaded = useCallback((requiredDocuments: string[]) => {
    return requiredDocuments.every(docType => {
      const state = uploadStates[docType];
      return state?.uploaded && state.backendId;
    });
  }, [uploadStates]); 


  return {
    uploadStates,
    initializeDocument,
    uploadDocument,
    removeDocument,
    getDocumentState,
    getAllUploadedDocuments,
    areAllRequiredDocumentsUploaded 
  };
};