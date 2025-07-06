
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CompanyInfoData, DirectorInfoData, DocumentUploadData, SubmitData, ApplicationStatus, VerificationStatus } from '@/lib/validationSchemas';

interface FormContextType {
  companyInfo: Partial<CompanyInfoData>;
  directorInfo: Partial<DirectorInfoData>;
  documentUpload: Partial<DocumentUploadData>;
  submitInfo: Partial<SubmitData>;
  applicationStatus: ApplicationStatus;
  uploadedFiles: Record<string, { name: string; url: string; size: number }>;
  setCompanyInfo: (data: Partial<CompanyInfoData>) => void;
  setDirectorInfo: (data: Partial<DirectorInfoData>) => void;
  setDocumentUpload: (data: Partial<DocumentUploadData>) => void;
  setSubmitInfo: (data: Partial<SubmitData>) => void;
  setApplicationStatus: (status: ApplicationStatus) => void;
  setUploadedFiles: (files: Record<string, { name: string; url: string; size: number }>) => void;
  submitApplication: () => void;
  resetForm: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};

export const FormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState<Partial<CompanyInfoData>>({});
  const [directorInfo, setDirectorInfo] = useState<Partial<DirectorInfoData>>({});
  const [documentUpload, setDocumentUpload] = useState<Partial<DocumentUploadData>>({});
  const [submitInfo, setSubmitInfo] = useState<Partial<SubmitData>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; url: string; size: number }>>({});
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({
    status: 'draft',
    canEdit: true
  });

  const submitApplication = () => {
    setApplicationStatus({
      status: 'submitted',
      submittedAt: new Date(),
      canEdit: false,
      comments: 'Aplikasi Anda sedang dalam proses review. Mohon tunggu konfirmasi dari tim verifikasi.'
    });

    // Simulate admin review process (for demo purposes)
    setTimeout(() => {
      setApplicationStatus(prev => ({
        ...prev,
        status: 'under_review',
        comments: 'Dokumen sedang dalam tahap verifikasi oleh tim KADIN Indonesia.'
      }));
    }, 2000);
  };

  const resetForm = () => {
    setCompanyInfo({});
    setDirectorInfo({});
    setDocumentUpload({});
    setSubmitInfo({});
    setUploadedFiles({});
    setApplicationStatus({
      status: 'draft',
      canEdit: true
    });
  };

  return (
    <FormContext.Provider
      value={{
        companyInfo,
        directorInfo,
        documentUpload,
        submitInfo,
        applicationStatus,
        uploadedFiles,
        setCompanyInfo,
        setDirectorInfo,
        setDocumentUpload,
        setSubmitInfo,
        setApplicationStatus,
        setUploadedFiles,
        submitApplication,
        resetForm,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
