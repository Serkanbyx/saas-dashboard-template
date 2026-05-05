import React from 'react';
import { ErrorFallback } from './ErrorFallback';

const createErrorId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `error-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export class ErrorBoundary extends React.Component {
  state = {
    hasError: false,
    errorId: null,
  };

  static getDerivedStateFromError() {
    return {
      hasError: true,
      errorId: createErrorId(),
    };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      errorId: null,
    });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return this.props.fallback ?? <ErrorFallback errorId={this.state.errorId} onReset={this.handleReset} />;
  }
}

