/**
 * ErrorBoundary Component
 * Catches React errors and displays a fallback UI
 */

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import React, { Component } from 'react';

import { Button } from './Button';

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to structured logger
    console.error('ErrorBoundary caught error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function ErrorFallback({ error, onRetry, onGoHome }: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="error-fallback">
      <div className="error-fallback-content">
        <AlertTriangle className="error-fallback-icon" />
        <h1 className="error-fallback-title">Something went wrong</h1>
        <p className="error-fallback-message">
          We&apos;re sorry, but something unexpected happened. Please try again or return to the home page.
        </p>
        
        {isDev && error && (
          <details className="error-fallback-details">
            <summary>Error Details (Development Only)</summary>
            <pre className="error-fallback-stack">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="error-fallback-actions">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome}>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </div>

      <style>{`
        .error-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          background: var(--color-background, #f9fafb);
        }
        .error-fallback-content {
          max-width: 32rem;
          text-align: center;
        }
        .error-fallback-icon {
          width: 4rem;
          height: 4rem;
          color: var(--color-destructive, #ef4444);
          margin: 0 auto 1.5rem;
        }
        .error-fallback-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-foreground, #111827);
          margin-bottom: 0.75rem;
        }
        .error-fallback-message {
          color: var(--color-muted-foreground, #6b7280);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        .error-fallback-details {
          text-align: left;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: var(--color-muted, #f3f4f6);
          border-radius: 0.5rem;
        }
        .error-fallback-details summary {
          cursor: pointer;
          font-weight: 500;
          color: var(--color-foreground, #111827);
        }
        .error-fallback-stack {
          margin-top: 0.75rem;
          font-size: 0.75rem;
          font-family: monospace;
          white-space: pre-wrap;
          word-break: break-all;
          color: var(--color-destructive, #ef4444);
        }
        .error-fallback-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

export default ErrorBoundary;
