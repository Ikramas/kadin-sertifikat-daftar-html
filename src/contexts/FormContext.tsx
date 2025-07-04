
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CompanyInfoData, DirectorInfoData, DocumentUploadData, SubmitData } from '@/lib/validationSchemas';

interface FormContextType {
  companyInfo: Partial<CompanyInfoData>;
  directorInfo: Partial<DirectorInfoData>;
  documentUpload: Partial<DocumentUploadData>;
  submitInfo: Partial<SubmitData>;
  setCompanyInfo: (data: Partial<CompanyInfoData>) => void;
  setDirectorInfo: (data: Partial<DirectorInfoData>) => void;
  setDocumentUpload: (data: Partial<DocumentUploadData>) => void;
  setSubmitInfo: (data: Partial<SubmitData>) => void;
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

  const resetForm = () => {
    setCompanyInfo({});
    setDirectorInfo({});
    setDocumentUpload({});
    setSubmitInfo({});
  };

  return (
    <FormContext.Provider
      value={{
        companyInfo,
        directorInfo,
        documentUpload,
        submitInfo,
        setCompanyInfo,
        setDirectorInfo,
        setDocumentUpload,
        setSubmitInfo,
        resetForm,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
