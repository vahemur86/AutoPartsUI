import api from "..";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

export const createShop = async (code: string, warehouseId: number) => {
  try {
    const response = await api.post(`/Shop`, {
      code,
      warehouseId,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create shop."));
  }
};

export const getShops = async (cashRegisterId?: number) => {
  try {
    const response = await api.get(`/Shop`, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get shops."));
  }
};

export const deleteShop = async (id: number) => {
  try {
    const response = await api.delete(`/Shop/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to delete shop."));
  }
};

export const updateShop = async (
  id: number,
  code: string,
  warehouseId: number,
) => {
  try {
    const response = await api.put(`/Shop`, { id, code, warehouseId });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update shop."));
  }
};
