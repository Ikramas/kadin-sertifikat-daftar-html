
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Home } from 'lucide-react';
import CompanyInfoForm from './CompanyInfoForm';
import DirectorInfoForm from './DirectorInfoForm';
import DocumentUploadForm from './DocumentUploadForm';
import SubmitSection from './SubmitSection';
import VerificationStatusBanner from './VerificationStatusBanner';
import { FormProvider, useFormContext } from '@/contexts/FormContext';
import { toast } from '@/hooks/use-toast';

const StepperFormContent = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepValidations, setStepValidations] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false
  });
  const { applicationStatus, resetForm } = useFormContext();
  const totalSteps = 4;
  const isDisabled = !applicationStatus.canEdit;

  const steps = [
    { number: 1, title: 'Informasi Perusahaan', component: CompanyInfoForm },
    { number: 2, title: 'Informasi Direktur', component: DirectorInfoForm },
    { number: 3, title: 'Upload Dokumen', component: DocumentUploadForm },
    { number: 4, title: 'Selesai', component: SubmitSection }
  ];

  const handleStepValidation = (step: number, isValid: boolean) => {
    setStepValidations(prev => ({
      ...prev,
      [step]: isValid
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps && !isDisabled) {
      if (!stepValidations[currentStep] && applicationStatus.status === 'draft') {
        toast({
          title: "Lengkapi Data",
          description: "Harap lengkapi semua field yang wajib diisi sebelum melanjutkan",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(currentStep + 1);
      toast({
        title: "Langkah Berikutnya",
        description: `Melanjutkan ke ${steps[currentStep].title}`,
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 1 && !isDisabled) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (isDisabled) return;
    if (step <= currentStep || stepValidations[step - 1]) {
      setCurrentStep(step);
    }
  };

  const handleFinalSubmit = () => {
    toast({
      title: "🎉 Aplikasi Berhasil Dikirim!",
      description: "Terima kasih! Aplikasi sertifikat Anda sedang diproses.",
    });
    
    setTimeout(() => {
      setCurrentStep(1);
    }, 2000);
  };

  const handleBackToHome = () => {
    setCurrentStep(1);
    toast({
      title: "Kembali ke Beranda",
      description: "Anda dapat melihat status aplikasi di sini",
    });
  };

  const handleEditApplication = () => {
    toast({
      title: "Mode Edit Diaktifkan",
      description: "Anda dapat mengedit aplikasi sekarang",
    });
  };

  const renderCurrentStep = () => {
    const CurrentStepComponent = steps[currentStep - 1].component;
    
    if (currentStep === 4) {
      return (
        <CurrentStepComponent 
          onValidation={(isValid: boolean) => handleStepValidation(currentStep, isValid)}
          onFinalSubmit={handleFinalSubmit}
        />
      );
    }
    
    return (
      <CurrentStepComponent 
        onValidation={(isValid: boolean) => handleStepValidation(currentStep, isValid)}
      />
    );
  };

  const showStatusBanner = applicationStatus.status !== 'draft';

  return (
    <div className="max-w-4xl mx-auto p-3">
      {/* Status Banner */}
      {showStatusBanner && (
        <>
          <VerificationStatusBanner 
            status={applicationStatus} 
            onEdit={handleEditApplication}
          />
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={handleBackToHome}
              className="flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </div>
        </>
      )}

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    currentStep === step.number 
                      ? 'bg-blue-600 text-white scale-110' 
                      : stepValidations[step.number] || currentStep > step.number
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  } ${isDisabled ? 'opacity-50' : ''}`}
                  onClick={() => goToStep(step.number)}
                >
                  {stepValidations[step.number] || (currentStep > step.number && step.number !== currentStep) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`hidden md:block ml-2 font-medium text-sm transition-colors duration-300 ${
                  currentStep === step.number 
                    ? 'text-blue-600' 
                    : stepValidations[step.number] || currentStep > step.number
                    ? 'text-green-600'
                    : 'text-gray-600'
                } ${isDisabled ? 'opacity-50' : ''}`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 md:w-12 h-1 rounded-full transition-colors duration-500 ${
                  stepValidations[step.number] || currentStep > step.number ? 'bg-green-400' : 'bg-gray-200'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Step Counter */}
        <div className="text-center">
          <div className="inline-flex items-center bg-white rounded-full px-3 py-1 shadow-lg border">
            <span className="text-sm font-semibold text-gray-600">
              Langkah {currentStep} dari {totalSteps}
            </span>
            {(stepValidations[currentStep] || isDisabled) && (
              <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
            )}
          </div>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="mb-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      {!showStatusBanner && (
        <div className="flex justify-between items-center px-2">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isDisabled}
            className={`h-10 px-4 font-semibold ${
              currentStep === 1 || isDisabled
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Sebelumnya
          </Button>

          <div className="flex space-x-1">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentStep === step.number 
                    ? 'bg-blue-600 scale-125' 
                    : stepValidations[step.number] || currentStep > step.number
                    ? 'bg-green-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              disabled={(!stepValidations[currentStep] && applicationStatus.status === 'draft') || isDisabled}
              className={`h-10 px-4 font-semibold ${
                (stepValidations[currentStep] || applicationStatus.status !== 'draft') && !isDisabled
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div className="w-20"></div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-700"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div className="text-center mt-2">
          <span className="text-sm text-gray-600 font-medium">
            {Math.round((currentStep / totalSteps) * 100)}% Selesai
          </span>
        </div>
      </div>
    </div>
  );
};

const StepperForm = () => {
  return (
    <FormProvider>
      <StepperFormContent />
    </FormProvider>
  );
};

export default StepperForm;
