import api from "..";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type { MetalRate } from "@/types/settings";

export const createMetalRate = async (metalRate: Omit<MetalRate, "id">) => {
  try {
    const response = await api.post(`/metal-rates`, metalRate);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create metal rate."));
  }
};

export const getMetalRates = async (cashRegisterId?: number) => {
  try {
    const response = await api.get("/metal-rates", {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get metal rates."));
  }
};

export const getMetalRate = async (id: number) => {
  try {
    const response = await api.get(`/metal-rates/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get metal rate."));
  }
};

export const getActiveMetalRate = async ({
  currencyCode,
  cashRegisterId,
}: {
  currencyCode: string;
  cashRegisterId: number;
}) => {
  try {
    const response = await api.get<MetalRate>(
      `/metal-rates/active/${currencyCode}`,
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get active metal rates."),
    );
  }
};

export const deleteMetalRate = async (id: number) => {
  try {
    const response = await api.delete(`/metal-rates/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to delete metal rate."));
  }
};

export const updateMetalRate = async (
  id: number,
  metalRate: Omit<MetalRate, "id">,
) => {
  try {
    const response = await api.put(`/metal-rates/${id}`, metalRate);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update metal rate."));
  }
};
