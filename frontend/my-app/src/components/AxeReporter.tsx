'use client';

import React, { useEffect } from 'react';
// We don't directly import ReactDOM here. axe.default expects the react-dom module reference.
// The `axe.default` function might implicitly try to find it or expects a specific setup.
// For modern React (18+) and Next.js App Router, `createRoot` is standard,
// but axe-core/react's default function is designed to work with how React is imported.

const AxeReporter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Only run in development and on the client-side
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      import('@axe-core/react').then(axe => {
        // axe.default takes React, ReactDOM, and a timeout.
        // For React 18+, ReactDOM methods like 'render' are often not directly used in components.
        // The library typically relies on a global React/ReactDOM being present or passed correctly.
        // A common pattern is to just pass 'React' and '1000' (delay) and an empty object for options.
        // It's more about hooking into React's update cycle.
        axe.default(React, 1000, {}); // Simplified for common usage with modern React
        console.log('Axe accessibility checker initialized in development mode.');
      }).catch(err => {
        console.error('Failed to load axe-core/react:', err);
      });
    }
  }, []);

  return <>{children}</>;
};

export default AxeReporter;