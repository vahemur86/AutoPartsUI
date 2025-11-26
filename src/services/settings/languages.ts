import { api } from "../index";

export const createLanguage = async (code: string, name: string) => {
  try {
    const response = await api.post(`/Languages`, { code, name });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to create language."
    );
  }
};

export const getLanguages = async () => {
  try {
    const response = await api.get(`/Languages`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to get languages."
    );
  }
};

export const deleteLanguage = async (id: number) => {
  try {
    const response = await api.delete(`/Languages/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to delete language"
    );
  }
};

export const updateLanguage = async (
  id: number,
  code: string,
  name: string
) => {
  try {
    const response = await api.put(`/Languages/${id}`, { id, code, name });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to update language"
    );
  }
};

export const getSingleLanguage = async (id: number) => {
  try {
    const response = await api.get(`/Languages/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to get language");
  }
};
