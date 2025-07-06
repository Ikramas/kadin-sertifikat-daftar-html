
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
    // Only allow going to completed steps or current step
    if (step <= currentStep || stepValidations[step - 1]) {
      setCurrentStep(step);
    }
  };

  const handleFinalSubmit = () => {
    toast({
      title: "🎉 Aplikasi Berhasil Dikirim!",
      description: "Terima kasih! Aplikasi sertifikat Anda sedang diproses. Kami akan menghubungi Anda segera.",
    });
    
    // Go back to step 1 to show the submitted form
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
    // This would typically be controlled by admin action
    // For demo, we'll simulate allowing edits
    toast({
      title: "Mode Edit Diaktifkan",
      description: "Anda dapat mengedit aplikasi sekarang",
    });
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  // Show status banner if application has been submitted
  const showStatusBanner = applicationStatus.status !== 'draft';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Status Banner */}
      {showStatusBanner && (
        <VerificationStatusBanner 
          status={applicationStatus} 
          onEdit={handleEditApplication}
        />
      )}

      {/* Back to Home Button */}
      {showStatusBanner && (
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBackToHome}
            className="flex items-center space-x-2 hover:bg-gray-50"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Button>
        </div>
      )}

      {/* Enhanced Progress indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-center space-x-4 mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex items-center">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                  } ${
                    currentStep === step.number 
                      ? 'bg-blue-600 text-white shadow-lg scale-110' 
                      : stepValidations[step.number] || currentStep > step.number
                      ? 'bg-green-600 text-white shadow-md hover:scale-105'
                      : 'bg-gray-300 text-gray-600 hover:bg-gray-400 hover:scale-105'
                  } ${isDisabled ? 'opacity-50' : ''}`}
                  onClick={() => goToStep(step.number)}
                >
                  {stepValidations[step.number] || (currentStep > step.number && step.number !== currentStep) ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`ml-3 font-medium transition-colors duration-300 ${
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
                <div className={`w-16 h-1 rounded-full transition-colors duration-500 ${
                  stepValidations[step.number] || currentStep > step.number ? 'bg-green-400' : 'bg-gray-200'
                }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Step counter */}
        <div className="text-center">
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg border border-white/50">
            <span className="text-sm font-semibold text-gray-600">
              Langkah {currentStep} dari {totalSteps}
            </span>
            {(stepValidations[currentStep] || isDisabled) && (
              <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
            )}
          </div>
        </div>
      </div>

      {/* Current step content with animation */}
      <div className="relative">
        <div className="transform transition-all duration-500 ease-in-out">
          <CurrentStepComponent 
            onValidation={(isValid: boolean) => handleStepValidation(currentStep, isValid)}
            onFinalSubmit={currentStep === 4 ? handleFinalSubmit : undefined}
          />
        </div>
      </div>

      {/* Navigation buttons */}
      {!showStatusBanner && (
        <div className="flex justify-between items-center mt-12 px-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || isDisabled}
            className={`h-14 px-8 rounded-xl font-semibold text-base transition-all duration-300 ${
              currentStep === 1 || isDisabled
                ? 'opacity-50 cursor-not-allowed' 
                : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Sebelumnya
          </Button>

          <div className="flex space-x-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
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
              className={`h-14 px-8 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                (stepValidations[currentStep] || applicationStatus.status !== 'draft') && !isDisabled
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Selanjutnya
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <div className="w-32"></div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-8">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-700 ease-out"
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
