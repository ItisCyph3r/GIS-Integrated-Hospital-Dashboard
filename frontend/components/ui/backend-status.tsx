'use client';

import { useBackendHealth } from '@/lib/hooks/useBackendHealth';

export function BackendStatus() {
  const { isHealthy, isLoading, error } = useBackendHealth();

  if (isHealthy && !isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-6">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-800 border-t-brand-600 dark:border-t-brand-400"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-brand-600 dark:text-brand-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isLoading ? 'Starting Backend...' : 'Backend Unavailable'}
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error || 'Waiting for the backend service to become available. This usually takes about 1 minute on Render.com hobby tier.'}
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
          </div>
          <span>Checking health endpoint...</span>
        </div>

        {!isLoading && error && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              💡 Tip: The backend may be spinning up from sleep mode. Please wait a moment and the page will automatically refresh when ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
