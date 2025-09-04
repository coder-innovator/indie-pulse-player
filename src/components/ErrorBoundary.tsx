import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    // Simple page reload instead of navigation
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-blue-900 text-white flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full bg-white text-black">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full border border-red-300">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-red-600">Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600 text-lg">
                  We encountered an unexpected error. This has been logged and our team will investigate.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-left bg-gray-100 p-4 rounded-lg border border-gray-300">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600 mb-2">
                      Error Details (Development)
                    </summary>
                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <strong>Error:</strong> {this.state.error.message}
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <strong>Stack:</strong>
                          <pre className="whitespace-pre-wrap text-xs mt-1 p-2 bg-gray-200 rounded border border-gray-300 overflow-auto max-h-32">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={this.handleRetry} 
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  If this problem persists, please contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple ErrorBoundary without navigation dependency
export const ErrorBoundary: React.FC<Props> = ({ children, fallback }) => {
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
};

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  const handleError = (error: Error, errorInfo?: any) => {
    console.error('Error handled by hook:', error, errorInfo);
    
    // You can add error reporting service here
    // Example: Sentry.captureException(error);
    
    // Show user-friendly error message
    // You can integrate with your toast system here
  };

  return { handleError };
};

// Higher-order component for error handling
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
