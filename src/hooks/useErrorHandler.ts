import { useToast } from '@/hooks/use-toast';
import { ErrorHandler } from '@/utils/errorHandler';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = (error: any, context: string = 'general', additionalData?: any) => {
    // Log the error
    ErrorHandler.logError(error, context, additionalData);
    
    // Get readable error message
    const message = ErrorHandler.getReadableErrorMessage(error);
    const severity = ErrorHandler.getErrorSeverity(error);
    const actions = ErrorHandler.getErrorActions(error);
    
    // Show toast notification
    toast({
      title: getErrorTitle(severity),
      description: message,
      variant: severity === 'critical' || severity === 'high' ? 'destructive' : 'default',
    });

    // Return error information for component handling
    return {
      message,
      severity,
      actions,
      shouldRetry: ErrorHandler.shouldRetry(error),
      context: ErrorHandler.getErrorContext(error)
    };
  };

  const handleValidationErrors = (errors: Record<string, string>, context: string = 'validation') => {
    // Log validation errors
    ErrorHandler.logError({ message: 'Validation failed', details: errors }, context);
    
    // Show general validation error
    toast({
      title: 'Data Tidak Valid',
      description: 'Mohon periksa kembali data yang Anda masukkan',
      variant: 'destructive',
    });

    return {
      message: 'Mohon periksa kembali data yang Anda masukkan',
      severity: 'medium' as const,
      errors,
      context: 'validation'
    };
  };

  const handleSuccess = (message: string, title: string = 'Berhasil') => {
    toast({
      title,
      description: message,
    });
  };

  const handleWarning = (message: string, title: string = 'Perhatian') => {
    toast({
      title,
      description: message,
      variant: 'default',
    });
  };

  return {
    handleError,
    handleValidationErrors,
    handleSuccess,
    handleWarning
  };
};

function getErrorTitle(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'critical':
      return 'Kesalahan Sistem';
    case 'high':
      return 'Kesalahan Keamanan';
    case 'medium':
      return 'Kesalahan';
    case 'low':
      return 'Peringatan';
    default:
      return 'Kesalahan';
  }
}