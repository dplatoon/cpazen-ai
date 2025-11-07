import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  onError?: (error: Error, attempt: number) => void;
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const { maxAttempts = 3, delayMs = 1000, onError } = options;
  const [isRetrying, setIsRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const executeWithRetry = useCallback(async (): Promise<T> => {
    let lastError: Error;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        setAttempt(i + 1);
        const result = await fn();
        setIsRetrying(false);
        return result;
      } catch (error) {
        lastError = error as Error;
        onError?.(lastError, i + 1);

        if (i < maxAttempts - 1) {
          setIsRetrying(true);
          toast.info(`Retrying... (${i + 1}/${maxAttempts})`, {
            duration: delayMs,
          });
          await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
        }
      }
    }

    setIsRetrying(false);
    toast.error(`Failed after ${maxAttempts} attempts`);
    throw lastError!;
  }, [fn, maxAttempts, delayMs, onError]);

  return { executeWithRetry, isRetrying, attempt };
}
