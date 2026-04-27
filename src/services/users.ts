import api from ".";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type { Operator } from "@/types/cash/registers";

export const createUser = async (
  email: string | null,
  role: string | null,
  userType: string | null,
  shopId: number | null,
  warehouseId: number | null,
  username: string | null,
) => {
  try {
    const response = await api.post(`/Users`, {
      username,
      email,
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
  email: string,
  role: string,
  userType: string,
  shopId: number,
  warehouseId: number,
) => {
  try {
    const response = await api.put(`/Users`, {
      email,
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
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get operators."));
  }
};

export const setPasswordRequest = async (
  token: string,
  password: string,
  cashRegisterId?: number,
) => {
  try {
    const response = await api.post(
      `/Users/set-password`,
      {
        token,
        password,
      },
      {
        headers: getHeaders(cashRegisterId),
      },
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to set password."));
  }
};
