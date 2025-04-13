/**
 * Generic type for API responses
 */
export type ApiResponse<T> = {
  status: number;
  data?: T;
  error?: string;
}; 