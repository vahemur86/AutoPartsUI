import api from ".";

// utils
import { getApiErrorMessage } from "@/utils";

export const createUser = async (
  username: string,
  password: string,
  role: string,
  userType: string,
  shopId: number,
  warehouseId: number,
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
