// src/components/providers.tsx
"use client";

import type { ReactNode } from 'react';
// If Genkit required a context provider, it would be wrapped here.
// For now, it's a simple pass-through for future extension.

export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
