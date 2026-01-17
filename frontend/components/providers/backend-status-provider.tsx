'use client';

import { BackendStatus } from '@/components/ui/backend-status';

export function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackendStatus />
      {children}
    </>
  );
}
