import api from "..";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type { MetalPrice } from "@/types/settings";

export const getMetalPrices = async (
  cashRegisterId: number,
): Promise<MetalPrice[]> => {
  try {
    const response = await api.get<MetalPrice[]>("/metals/prices", {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get metal prices."));
  }
};
