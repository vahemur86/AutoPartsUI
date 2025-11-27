import api from "..";

export const createShop = async (code: string, warehouseId: number) => {
  try {
    const response = await api.post(`/Shop`, {
      code,
      warehouseId,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to create shop.");
  }
};

export const getShops = async () => {
  try {
    const response = await api.get(`/Shop`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to get shops.");
  }
};

export const deleteShop = async (id: number) => {
  try {
    const response = await api.delete(`/Shop/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to delete shop.");
  }
};

export const updateShop = async (
  id: number,
  code: string,
  warehouseId: number
) => {
  try {
    const response = await api.put(`/Shop`, { id, code, warehouseId });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to update shop.");
  }
};
