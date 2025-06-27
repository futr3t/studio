
"use client";

import React from 'react';
import { DataProvider } from '@/context/DataContext';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/error-boundary';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
