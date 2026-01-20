import api from "..";

// utils
import { getApiErrorMessage } from "@/utils";

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

export const getMetalRates = async () => {
  try {
    const response = await api.get("/metal-rates");
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

export const getActiveMetalRates = async (currencyCode: string) => {
  try {
    const response = await api.get(`/metal-rates/active/${currencyCode}`);
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
