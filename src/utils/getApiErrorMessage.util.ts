import type { AxiosError } from "axios";

type ApiErrorResponse = {
  error?: string;
  message?: string;
  detail?: string;
  title?: string;
  errors?: Record<string, string | string[]>;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (error && typeof error === "object") {
    const axiosError = error as AxiosError<ApiErrorResponse | string>;

    // 1. Check if response data is an object with an 'error' property
    const responseData = axiosError.response?.data;
    if (responseData && typeof responseData === "object") {
      const validationMessages = Object.values(responseData.errors ?? {})
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === "string");

      if (responseData.error) return responseData.error;
      if (responseData.message) return responseData.message;
      if (responseData.detail) return responseData.detail;
      if (validationMessages.length) return validationMessages.join("\n");
      if (responseData.title) return responseData.title;
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
