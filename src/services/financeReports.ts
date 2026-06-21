import api from "./index";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

type QueryValue = string | number | boolean | undefined;

type QueryParams = Record<string, QueryValue>;

const buildQuery = (params: QueryParams): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    searchParams.append(key, String(value));
  });

  return searchParams.toString();
};

export const getProfitBySaleId = async (
  saleId: number,
  cashRegisterId?: number,
) => {
  try {
    const response = await api.get(`/ProfitReport/sale/${saleId}`, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch sale profit."));
  }
};

export const getProfitSummary = async (
  params: {
    shopId: number;
    fromDate?: string;
    toDate?: string;
  },
  cashRegisterId?: number,
) => {
  try {
    const query = buildQuery(params);
    const response = await api.get(`/ProfitReport/summary?${query}`, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch profit summary."),
    );
  }
};

export const getProfitDetailed = async (
  params: {
    shopId: number;
    fromDate?: string;
    toDate?: string;
  },
  cashRegisterId?: number,
) => {
  try {
    const query = buildQuery(params);
    const response = await api.get(`/ProfitReport/detailed?${query}`, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch detailed profit report."),
    );
  }
};

export const getWarehouseInventoryStatus = async (
  warehouseId: number,
  options?: { productId?: number; cashRegisterId?: number },
) => {
  try {
    const path = options?.productId
      ? `/InventoryStatus/warehouse/${warehouseId}/product/${options.productId}`
      : `/InventoryStatus/warehouse/${warehouseId}`;

    const response = await api.get(path, {
      headers: getHeaders(options?.cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch warehouse inventory status."),
    );
  }
};

export const getShopInventoryStatus = async (
  shopId: number,
  options?: { productId?: number; cashRegisterId?: number },
) => {
  try {
    const path = options?.productId
      ? `/InventoryStatus/shop/${shopId}/product/${options.productId}`
      : `/InventoryStatus/shop/${shopId}`;

    const response = await api.get(path, {
      headers: getHeaders(options?.cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch shop inventory status."),
    );
  }
};
