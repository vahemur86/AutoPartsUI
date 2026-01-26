import api from "..";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { CashRegister } from "@/types/settings";

export const getCashRegisters = async (shopId?: number) => {
  try {
    const params = shopId ? { shopId } : {};
    const response = await api.get("/cash-registers", { params });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get cash registers."),
    );
  }
};

export const createCashRegister = async (
  cashRegister: Omit<CashRegister, "id" | "isActive">,
) => {
  try {
    const response = await api.post("/cash-registers", cashRegister);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create cash register."),
    );
  }
};

export const updateCashRegister = async (
  id: number,
  cashRegister: Omit<CashRegister, "id" | "shopId">,
) => {
  try {
    const response = await api.put(`/cash-registers/${id}`, cashRegister);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update cash register."),
    );
  }
};

export const deleteCashRegister = async (id: number) => {
  try {
    const response = await api.delete(`/cash-registers/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to delete cash register."),
    );
  }
};

