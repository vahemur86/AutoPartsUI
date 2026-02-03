import type { AxiosError } from "axios";

type ApiErrorResponse = {
  error?: string;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (error && typeof error === "object") {
    // Handle AxiosError with response data
    const axiosError = error as AxiosError<ApiErrorResponse>;
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    
    // Handle Error objects (including those thrown by services)
    if (error instanceof Error && error.message) {
      return error.message;
    }
    
    // Handle AxiosError message
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  
  // Handle string errors (from rejectWithValue)
  if (typeof error === "string") {
    return error;
  }

  return fallback;
};
