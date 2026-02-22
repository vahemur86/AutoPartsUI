import api from "..";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

export const createLanguage = async (
  code: string,
  name: string,
  isDefault: boolean,
  isEnabled: boolean,
) => {
  try {
    const response = await api.post(`/Languages`, {
      code,
      name,
      isDefault,
      isEnabled,
    });

    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create language."));
  }
};

export const getLanguages = async (cashRegisterId?: number) => {
  try {
    const response = await api.get(`/Languages`, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get languages."));
  }
};

export const deleteLanguage = async (id: number) => {
  try {
    const response = await api.delete(`/Languages/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to delete language."));
  }
};

export const updateLanguage = async (
  id: number,
  code: string,
  name: string,
  isDefault: boolean,
  isEnabled: boolean,
) => {
  try {
    const response = await api.put(`/Languages/${id}`, {
      id,
      code,
      name,
      isDefault,
      isEnabled,
    });

    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update language."));
  }
};

export const getSingleLanguage = async (id: number) => {
  try {
    const response = await api.get(`/Languages/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get language."));
  }
};
