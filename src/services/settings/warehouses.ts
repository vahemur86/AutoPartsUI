import api from "..";

// utils
import { getApiErrorMessage } from "@/utils";

export const createWarehouse = async (code: string) => {
  try {
    const response = await api.post(`/Warehouse`, { code });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create warehouse."));
  }
};

export const getWarehouses = async () => {
  try {
    const response = await api.get(`/Warehouse`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get warehouse."));
  }
};

export const deleteWarehouse = async (id: number) => {
  try {
    const response = await api.delete(`/Warehouse/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to delete warehouse."));
  }
};

export const updateWarehouse = async (id: number, code: string) => {
  try {
    const response = await api.put(`/Warehouse`, { id, code });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update warehouse."));
  }
};
