"use client";

import React from 'react';

// This component can be used to wrap context providers if needed later.
// For now, it just renders children.
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
