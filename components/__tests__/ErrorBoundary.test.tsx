/**
 * Tests for ErrorBoundary component
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, ErrorFallback } from '../ErrorBoundary';

// Component that throws an error for testing
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders fallback when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test error');
  });
});

describe('ErrorFallback', () => {
  it('renders error message', () => {
    render(<ErrorFallback error={new Error('Test error')} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls onRetry when Try Again clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorFallback onRetry={onRetry} />);

    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onGoHome when Go Home clicked', () => {
    const onGoHome = vi.fn();
    render(<ErrorFallback onGoHome={onGoHome} />);

    fireEvent.click(screen.getByText('Go Home'));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });
});
