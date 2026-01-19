import api from "..";

// utils
import { getApiErrorMessage } from "@/utils";

export const createTask = async (code: string, laborCost: number) => {
  try {
    const response = await api.post(`/admin/service-tasks`, {
      code,
      laborCost,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create task."));
  }
};

export const getTasks = async () => {
  try {
    const response = await api.get("/admin/service-tasks?includeInactive=true");
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get tasks."));
  }
};

export const deleteTask = async (id: number) => {
  try {
    const response = await api.delete(`/admin/service-tasks/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to delete task."));
  }
};

export const updateTask = async (
  id: number,
  code: string,
  laborCost: number,
  isActive: boolean,
) => {
  try {
    const response = await api.put(`/admin/service-tasks/${id}`, {
      code,
      laborCost,
      isActive,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update task."));
  }
};
