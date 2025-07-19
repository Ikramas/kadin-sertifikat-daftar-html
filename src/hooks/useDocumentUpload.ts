import { useState } from 'react';
import { useErrorHandler } from './useErrorHandler';
import { DocumentUploadState } from '@/types/company';

interface UseDocumentUploadProps {
  onUploadComplete?: (documentType: string, backendId: string) => void;
}

export const useDocumentUpload = ({ onUploadComplete }: UseDocumentUploadProps = {}) => {
  const [uploadStates, setUploadStates] = useState<DocumentUploadState>({});
  const { handleError, handleSuccess } = useErrorHandler();

  const initializeDocument = (documentType: string) => {
    setUploadStates(prev => ({
      ...prev,
      [documentType]: {
        file: null,
        uploaded: false,
        uploading: false,
        backendId: null,
        error: null
      }
    }));
  };

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
    // Validate file first
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

    // Set uploading state
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
      // Get CSRF token
      const csrfResponse = await fetch('/backend/api/auth/csrf-token.php', {
        credentials: 'include'
      });
      const csrfData = await csrfResponse.json();

      if (!csrfData.success) {
        throw new Error('Gagal mendapatkan token keamanan');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      formData.append('category', 'initial_registration');

      // Get JWT token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan');
      }

      // Upload file
      const uploadResponse = await fetch('/backend/api/documents/upload.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': csrfData.csrf_token
        },
        body: formData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.message || 'Gagal mengunggah dokumen');
      }

      // Update success state
      setUploadStates(prev => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          uploaded: true,
          uploading: false,
          backendId: uploadData.data.id,
          error: null
        }
      }));

      handleSuccess(`Dokumen ${documentType} berhasil diunggah`);
      onUploadComplete?.(documentType, uploadData.data.id);
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
      error: null
    };
  };

  const getAllUploadedDocuments = () => {
    return Object.entries(uploadStates)
      .filter(([_, state]) => state.uploaded && state.backendId)
      .map(([documentType, state]) => ({
        documentType,
        backendId: state.backendId!
      }));
  };

  const areAllRequiredDocumentsUploaded = (requiredDocuments: string[]) => {
    return requiredDocuments.every(docType => {
      const state = uploadStates[docType];
      return state?.uploaded && state.backendId;
    });
  };

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