import type { CatalystPricing } from "@/types/settings";
import api from "..";
import { getApiErrorMessage, getHeaders } from "@/utils";

export const getCatalystPricing = async (cashRegisterId?: number) => {
  try {
    const response = await api.get("/admin/catalyst-pricing-settings", {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get catalyst pricings."),
    );
  }
};

export const updateCatalystPricing = async (
  catalystPricing: CatalystPricing,
  cashRegisterId?: number,
) => {
  try {
    const response = await api.put(
      `/admin/catalyst-pricing-settings`,
      catalystPricing,
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update catalyst pricing."),
    );
  }
};
