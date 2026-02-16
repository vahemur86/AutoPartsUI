import type { AxiosError } from "axios";

type ApiErrorResponse = {
  error?: string;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (error && typeof error === "object") {
    const axiosError = error as AxiosError<ApiErrorResponse | string>;

    // 1. Check if response data is an object with an 'error' property
    if (
      typeof axiosError.response?.data === "object" &&
      axiosError.response?.data?.error
    ) {
      return axiosError.response.data.error;
    }

    // 2. Check if response data is just a plain string (Your current issue)
    if (typeof axiosError.response?.data === "string") {
      return axiosError.response.data;
    }

    // 3. Handle Error objects (including those thrown by services)
    if (error instanceof Error && error.message) {
      return error.message;
    }

    // 4. Handle Axios default message (e.g., "Network Error")
    if (axiosError.message) {
      return axiosError.message;
    }
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
};
