import type { AxiosError } from "axios";

type ApiErrorResponse = {
  error?: string;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (error && typeof error === "object") {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return axiosError.response?.data?.error || axiosError.message || fallback;
  }

  return fallback;
};
