import api from "..";

// utils
import { getApiErrorMessage } from "@/utils";

type TaskPayload = {
  code: string;
  laborCost: number | null;
  shopId?: number | null;
  warehouseId?: number | null;
  paymentDay?: string | null;
};

const normalizePayload = (
  codeOrPayload: string | TaskPayload,
  laborCost?: number | null,
): TaskPayload => {
  if (typeof codeOrPayload === "string") {
    return {
      code: codeOrPayload,
      laborCost: laborCost ?? null,
    };
  }

  return {
    code: codeOrPayload.code,
    laborCost: codeOrPayload.laborCost,
    shopId: codeOrPayload.shopId ?? null,
    warehouseId: codeOrPayload.warehouseId ?? null,
    paymentDay: codeOrPayload.paymentDay ?? null,
  };
};

export const createTask = async (
  codeOrPayload: string | TaskPayload,
  laborCost?: number | null,
) => {
  try {
    const payload = normalizePayload(codeOrPayload, laborCost);
    const response = await api.post(`/admin/service-tasks`, payload);
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
  codeOrPayload: string | (TaskPayload & { isActive?: boolean }),
  laborCost?: number | null,
  isActive?: boolean,
) => {
  try {
    const basePayload = normalizePayload(codeOrPayload, laborCost);
    const resolvedIsActive =
      typeof codeOrPayload === "string"
        ? Boolean(isActive)
        : Boolean(codeOrPayload.isActive);

    const response = await api.put(`/admin/service-tasks/${id}`, {
      ...basePayload,
      isActive: resolvedIsActive,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update task."));
  }
};
