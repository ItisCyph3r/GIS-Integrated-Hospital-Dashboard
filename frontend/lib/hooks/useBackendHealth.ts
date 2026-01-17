import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface HealthStatus {
  isHealthy: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to check backend health
 */
export function useBackendHealth(): HealthStatus {
  const [isHealthy, setIsHealthy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 40; // ~2 minutes
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); 

        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache',
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          if (isMounted) {
            setIsHealthy(true);
            setIsLoading(false);
            setError(null);
          }
          return; 
        } else {
          throw new Error(`Health check failed: ${response.status}`);
        }
      } catch (err) {
        if (!isMounted) return;

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        if (errorMessage.includes('aborted') || errorMessage.includes('timeout')) {
          setError('Backend is starting up...');
        } else {
          setError(errorMessage);
        }

        retryCount++;
        
        if (retryCount >= maxRetries) {
          if (isMounted) {
            setIsLoading(false);
            setError('Backend is taking longer than expected to start. Please try again in a moment.');
          }
          return; 
        }

        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
        
        timeoutId = setTimeout(() => {
          if (isMounted) {
            checkHealth();
          }
        }, delay);
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return { isHealthy, isLoading, error };
}
