
"use client";

import React from 'react';
import { DataProvider } from '@/context/DataContext';
import { AuthProvider } from '@/context/AuthContext';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        {children}
      </DataProvider>
    </AuthProvider>
  );
}
