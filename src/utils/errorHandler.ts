import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'sonner';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleSupabaseError(error: PostgrestError | Error): AppError {
  if ('code' in error && 'details' in error) {
    const postgrestError = error as PostgrestError;
    
    switch (postgrestError.code) {
      case '23505':
        return new AppError('This record already exists', postgrestError.code, 409);
      case '23503':
        return new AppError('Referenced record not found', postgrestError.code, 404);
      case 'PGRST116':
        return new AppError('No rows found', postgrestError.code, 404);
      case '42501':
        return new AppError('Permission denied', postgrestError.code, 403);
      default:
        return new AppError(
          postgrestError.message || 'Database error',
          postgrestError.code,
          500,
          postgrestError.details
        );
    }
  }
  
  return new AppError(error.message || 'An unexpected error occurred', undefined, 500);
}

export function showErrorToast(error: unknown) {
  let message = 'An unexpected error occurred';
  
  if (error instanceof AppError) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  toast.error(message, {
    description: import.meta.env.DEV && error instanceof Error 
      ? error.stack?.split('\n').slice(0, 3).join('\n')
      : undefined,
  });
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error(`Error in ${context || 'operation'}:`, error);
    showErrorToast(error);
    return null;
  }
}
