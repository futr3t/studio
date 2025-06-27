"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Client-side error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                A client-side error has occurred. This might be due to a temporary issue.
              </p>
              {this.state.error && (
                <div className="text-xs text-left bg-gray-100 p-3 rounded font-mono">
                  <div className="font-semibold mb-1">Error:</div>
                  {this.state.error.message}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-2">
                      <div className="font-semibold">Stack:</div>
                      <pre className="whitespace-pre-wrap text-xs">{this.state.error.stack}</pre>
                    </div>
                  )}
                </div>
              )}
              <button
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}