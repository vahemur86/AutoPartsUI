import api from ".";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type {
  BuyIronPayload,
  UpdateProductPricePayload,
  OrderLinePayload,
  GetIronPurchasesParams,
} from "@/types/adminProducts";

const BASE_URL = "/admin";

export const buyIron = async (
  payload: BuyIronPayload,
  cashRegisterId: number,
) => {
  try {
    const response = await api.post(`${BASE_URL}/iron`, payload, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create iron entry."));
  }
};

export const updateProductPrice = async (
  productId: number,
  payload: UpdateProductPricePayload,
  cashRegisterId?: number,
) => {
  try {
    const response = await api.post(
      `${BASE_URL}/products/${productId}/price`,
      payload,
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update price."));
  }
};

export const getIronProducts = async ({
  cashRegisterId,
  lang = "en",
}: {
  cashRegisterId?: number;
  lang: string;
}) => {
  try {
    const response = await api.get(`${BASE_URL}/products/iron`, {
      params: { lang: lang === "am" ? "hy" : lang },
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch iron products."),
    );
  }
};

export const getIronDropdown = async ({
  cashRegisterId,
  lang = "en",
}: {
  cashRegisterId: number;
  lang: string;
}) => {
  try {
    const response = await api.get(`${BASE_URL}/products/iron-dropdown`, {
      params: { lang: lang === "am" ? "hy" : lang },
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch dropdown data."),
    );
  }
};

export const createOrderLine = async (
  payload: OrderLinePayload,
  cashRegisterId: number,
  lang: string = "en",
) => {
  try {
    const response = await api.post(
      `${BASE_URL}/products/order-line`,
      payload,
      {
        params: { lang },
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create order line."));
  }
};

export const getIronPurchases = async (
  params: GetIronPurchasesParams,
  cashRegisterId?: number,
) => {
  try {
    const response = await api.get(`${BASE_URL}/products/GetIronPurchases`, {
      params,
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch iron purchases."),
    );
  }
};
