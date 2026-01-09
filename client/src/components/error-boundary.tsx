/**
 * React Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 * the entire application.
 * 
 * Features:
 * - Graceful error handling with user-friendly fallback UI
 * - Error logging for debugging and monitoring
 * - Recovery mechanism to allow users to retry
 * - Development vs production error display modes
 * - Automatic error reporting (ready for integration)
 * 
 * @module ErrorBoundary
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { logger } from '@shared/logger';
import { captureException } from '@/lib/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

/**
 * Error Boundary Class Component
 * React Error Boundaries must be class components
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging and monitoring
    logger.error('React Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    });

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service
    captureException(error, { componentStack: errorInfo.componentStack });
  }

  private handleRetry = () => {
    // Reset error state to allow retry
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: '',
    });
  };

  private handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  private handleReload = () => {
    // Reload the entire page as last resort
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-red-200 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              
              <CardTitle className="text-2xl text-red-800">
                Oops! Something went wrong
              </CardTitle>
              
              <CardDescription className="text-base">
                We've encountered an unexpected error. Don't worry - your data is safe, 
                and our team has been notified.
              </CardDescription>
              
              <div className="flex justify-center mt-3">
                <Badge variant="secondary" className="font-mono text-xs">
                  Error ID: {this.state.errorId}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  className="flex items-center space-x-2"
                  size="lg"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Try Again</span>
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center space-x-2"
                  size="lg"
                >
                  <Home className="h-4 w-4" />
                  <span>Go Home</span>
                </Button>
              </div>
              
              {/* Development Error Details */}
              {isDevelopment && this.state.error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                    <Bug className="h-4 w-4 mr-2" />
                    Development Error Details
                  </h4>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong className="text-red-700">Error:</strong>
                      <pre className="mt-1 p-2 bg-red-100 rounded text-red-800 overflow-x-auto text-xs">
                        {this.state.error.message}
                      </pre>
                    </div>
                    
                    {this.state.error.stack && (
                      <div>
                        <strong className="text-red-700">Stack Trace:</strong>
                        <pre className="mt-1 p-2 bg-red-100 rounded text-red-800 overflow-x-auto text-xs max-h-32 overflow-y-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong className="text-red-700">Component Stack:</strong>
                        <pre className="mt-1 p-2 bg-red-100 rounded text-red-800 overflow-x-auto text-xs max-h-32 overflow-y-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Help Text */}
              <div className="text-center text-sm text-muted-foreground border-t pt-4">
                <p>
                  If this problem persists, please{' '}
                  <Button
                    variant="link" 
                    className="p-0 h-auto text-sm text-blue-600 underline"
                    onClick={this.handleReload}
                  >
                    reload the page
                  </Button>
                  {' '}or contact support with error ID: {this.state.errorId}
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

/**
 * Hook-based Error Boundary for functional components
 * Note: This is a wrapper around the class-based ErrorBoundary
 */
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = (props) => {
  return <ErrorBoundary {...props} />;
};

/**
 * Higher-Order Component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
): React.FC<P> {
  const WithErrorBoundaryComponent: React.FC<P> = (props) => {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WithErrorBoundaryComponent;
}

export default ErrorBoundary;