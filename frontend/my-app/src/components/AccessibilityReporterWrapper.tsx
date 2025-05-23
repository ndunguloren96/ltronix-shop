'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import AxeReporter, disabling SSR for it
const DynamicAxeReporter = dynamic(() => import('./AxeReporter'), {
  ssr: false, // This is now allowed because this file is a client component
});

const AccessibilityReporterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Only render AxeReporter in development mode
  if (process.env.NODE_ENV === 'development') {
    return <DynamicAxeReporter>{children}</DynamicAxeReporter>;
  }
  return <>{children}</>;
};

export default AccessibilityReporterWrapper;