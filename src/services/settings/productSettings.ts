import api from "..";

export const createCategory = async (code: string) => {
  try {
    const response = await api.post(`/Category`, { code });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || "Failed to create category."
    );
  }
};
