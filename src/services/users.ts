import api from ".";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { Operator } from "@/types/cash/registers";

export const createUser = async (
  username: string | null,
  password: string | null,
  role: string | null,
  userType: string | null,
  shopId: number | null,
  warehouseId: number | null,
) => {
  try {
    const response = await api.post(`/Users`, {
      username,
      password,
      role,
      userType,
      shopId,
      warehouseId,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create user."));
  }
};

export const getUsers = async () => {
  try {
    const response = await api.get(`/Users`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get users."));
  }
};

export const deleteUser = async (id: number) => {
  try {
    const response = await api.delete(`/Users/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to delete user."));
  }
};

export const updateUser = async (
  username: string,
  password: string,
  role: string,
  userType: string,
  shopId: number,
  warehouseId: number,
) => {
  try {
    const response = await api.put(`/Users`, {
      username,
      password,
      role,
      userType,
      shopId,
      warehouseId,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update user."));
  }
};

export const getOperators = async ({
  role,
  cashRegisterId,
  shopId,
}: {
  role?: number;
  cashRegisterId?: number;
  shopId?: number;
} = {}): Promise<Operator[]> => {
  try {
    const response = await api.get<Operator[]>(`/Users/operators`, {
      params: {
        role,
        shopId,
      },
      headers:
        cashRegisterId !== undefined
          ? { "X-CashRegister-Id": cashRegisterId }
          : undefined,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get operators."));
  }
};
