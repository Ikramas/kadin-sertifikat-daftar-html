// src/contexts/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast'; 
import { ErrorHandler } from '@/utils/errorHandler'; // Mengimpor ErrorHandler

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    
    // Log error ke backend menggunakan ErrorHandler
    ErrorHandler.logError(error, 'global_frontend_error', { componentStack: errorInfo.componentStack });
    this.logErrorToBackend(error, errorInfo);

    // Tampilkan toast yang ramah pengguna
    const readableMessage = ErrorHandler.getReadableErrorMessage(error);
    const severity = ErrorHandler.getErrorSeverity(error);

    toast({
      title: ErrorHandler.getErrorTitle(severity), // FIX: Menggunakan ErrorHandler.getErrorTitle
      description: readableMessage,
      variant: severity === 'critical' || severity === 'high' ? 'destructive' : 'default',
    });
  }

  private async logErrorToBackend(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      await fetch('/backend/api/logs/frontend-error.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (logError) {
      console.error('Failed to log error to backend:', logError);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-foreground">
              Oops! Terjadi kesalahan
            </h1>
            <p className="text-muted-foreground max-w-md">
              Sistem mengalami gangguan. Tim kami telah diberitahu dan sedang menangani masalah ini. Mohon coba muat ulang halaman.
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="text-left text-xs bg-gray-100 p-4 rounded-md mt-4 overflow-auto">
                  <code>{this.state.error.message}</code>
                  <br />
                  <code>{this.state.error.stack}</code>
                </pre>
              )}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}