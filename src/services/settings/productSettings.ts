import { api } from "../index";

export const createCategory = async (code: string) => {
  try {
    const response = await api.post(`/Category`, { code });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to create category."
    );
  }
};
