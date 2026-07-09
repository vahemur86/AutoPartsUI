import api from "./index";

// utils
import { getApiErrorMessage } from "@/utils";import { getCashRegisterId } from "@/utils/getCashRegisterId.util";
import { getHeaders } from "@/utils/getHeaders.util";
export interface UserLanguagePreferenceResponse {
  language: string | null;
  isPersonal: boolean;
  usingGlobalDefault: boolean;
}

export interface SetUserLanguageResponse {
  language: string;
}

export interface ResetUserLanguageResponse {
  message: string;
}

export const getUserLanguagePreference = async () => {
  try {
    const response = await api.get<UserLanguagePreferenceResponse>(
      "/users/me/language",
      {
        headers: getHeaders(getCashRegisterId()),
      },
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get user language preference."),
    );
  }
};

export const setUserLanguagePreference = async (languageCode: string) => {
  try {
    const response = await api.put<SetUserLanguageResponse>(
      "/users/me/language",
      { languageCode },
      {
        headers: getHeaders(getCashRegisterId()),
      },
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to set user language preference."),
    );
  }
};

export const resetUserLanguagePreference = async () => {
  try {
    const response = await api.delete<ResetUserLanguageResponse>(
      "/users/me/language",
      {
        headers: getHeaders(getCashRegisterId()),
      },
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to reset user language preference."),
    );
  }
};
