'use client';

import React from 'react';
import { Button } from './button';
import { useTheme, logger } from '@shared/lib';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  const { classes } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${classes.bg}`}>
      <div className={`max-w-md w-full ${classes.bgSurface} ${classes.border} rounded-lg shadow-lg p-6`}>
        <h2 className={`text-xl font-semibold mb-4 ${classes.text}`}>오류가 발생했습니다</h2>
        <p className={`text-sm mb-4 ${classes.textMuted}`}>
          예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className={`mb-4 ${classes.bgSurfaceSubtle} rounded p-3`}>
            <summary className={`text-sm cursor-pointer ${classes.textMuted}`}>에러 상세 정보</summary>
            <pre className={`mt-2 text-xs overflow-auto ${classes.textMuted}`}>
              {error.message}
              {'\n'}
              {error.stack}
            </pre>
          </details>
        )}
        <div className="flex gap-2">
          <Button onClick={resetError} variant="primary">
            다시 시도
          </Button>
          <Button
            onClick={() => {
              window.location.href = '/';
            }}
            variant="secondary"
          >
            홈으로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}

