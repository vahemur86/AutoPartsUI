import api from "..";
import { AxiosError } from "axios";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type { ShopPricing } from "@/types/settings";

export const getShopPricingByShopId = async (
  shopId: number,
  cashRegisterId?: number,
): Promise<ShopPricing | null> => {
  try {
    const response = await api.get<ShopPricing>(`/ShopPricing/shop/${shopId}`, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      return null;
    }

    throw new Error(
      getApiErrorMessage(error, "Failed to load shop pricing settings."),
    );
  }
};

export const createShopPricing = async (
  shopId: number,
  markupPercentage: number,
  cashRegisterId?: number,
): Promise<ShopPricing> => {
  try {
    const response = await api.post<ShopPricing>(
      `/ShopPricing`,
      {
        shopId,
        markupPercentage,
      },
      {
        headers: getHeaders(cashRegisterId),
      },
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to save shop pricing settings."),
    );
  }
};

export const applyShopPricingToExisting = async (
  shopId: number,
  cashRegisterId?: number,
): Promise<void> => {
  try {
    await api.post(
      `/ShopPricing/shop/${shopId}/apply-to-existing`,
      {},
      {
        headers: getHeaders(cashRegisterId),
      },
    );
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to apply pricing to existing stock."),
    );
  }
};
