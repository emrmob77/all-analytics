"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { captureFrontendError } from "@/lib/observability/monitoring";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Captures unexpected rendering errors and shows a safe fallback UI.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureFrontendError(error, { componentStack: errorInfo.componentStack ?? undefined });
    console.error("[ErrorBoundary] UI crash captured", { error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <main className="grid min-h-screen place-items-center bg-background-light px-6 text-text-main-light dark:bg-background-dark dark:text-text-main-dark">
        <section className="w-full max-w-md rounded-xl border border-border-light bg-surface-light p-8 text-center shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <p className="mb-2 text-sm font-semibold tracking-wide text-red-600 dark:text-red-400">Something went wrong</p>
          <h1 className="mb-3 text-2xl font-bold">Unexpected error</h1>
          <p className="mb-6 text-sm text-text-muted-light dark:text-text-muted-dark">
            We could not render this view. Try refreshing the section.
          </p>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            onClick={this.handleReset}
            type="button"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
