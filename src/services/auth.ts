import api from ".";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type { Credentials } from "@/types/auth";

export const login = async ({ username, password }: Credentials) => {
  try {
    const response = await api.post(`/Auth/Login`, {
      username,
      password,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to login."));
  }
};

export const logoutRequest = async (cashRegisterId?: number | null) => {
  try {
    const response = await api.post(`/auth/logout`, undefined, {
      headers: getHeaders(cashRegisterId ?? undefined),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Logout failed."));
  }
};
