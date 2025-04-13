/**
 * Base URL for the backend API
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Generic type for API responses
 */
export type ApiResponse<T> = {
  status: number;
  data?: T;
  error?: string;
};

/**
 * Common fetch options configuration
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Common error handling for API requests
 */
export function handleApiError(error: unknown): ApiResponse<never> {
  return {
    status: 500,
    error: `API error: ${error instanceof Error ? error.message : String(error)}`
  };
} 