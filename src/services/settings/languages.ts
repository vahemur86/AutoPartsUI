import api from "..";

export const createLanguage = async (
  code: string,
  name: string,
  isDefault: boolean,
  isEnabled: boolean
) => {
  try {
    const response = await api.post(`/Languages`, {
      code,
      name,
      isDefault,
      isEnabled,
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to create language.";
    throw new Error(errorMessage);
  }
};

export const getLanguages = async () => {
  try {
    const response = await api.get(`/Languages`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to get languages.");
  }
};

export const deleteLanguage = async (id: number) => {
  try {
    const response = await api.delete(`/Languages/${id}`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to delete language";
    throw new Error(errorMessage);
  }
};

export const updateLanguage = async (
  id: number,
  code: string,
  name: string,
  isDefault: boolean,
  isEnabled: boolean
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
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to update language";
    throw new Error(errorMessage);
  }
};

export const getSingleLanguage = async (id: number) => {
  try {
    const response = await api.get(`/Languages/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to get language");
  }
};
