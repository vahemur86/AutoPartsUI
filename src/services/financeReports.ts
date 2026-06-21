import api from "./index";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";
import { AxiosError } from "axios";

type QueryValue = string | number | boolean | undefined;

type QueryParams = Record<string, QueryValue>;

const toPositiveNumber = (value: unknown): number | undefined => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return undefined;
  }

  return numeric;
};

const getCashRegisterIdFromStorage = (): number | undefined => {
  const directValues = [
    localStorage.getItem("cashRegisterId"),
    localStorage.getItem("cash_register_id"),
  ];

  for (const value of directValues) {
    const parsed = toPositiveNumber(value);
    if (parsed) {
      return parsed;
    }
  }

  const jsonKeys = ["user_data", "userContext", "auth_user"];

  for (const key of jsonKeys) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const candidates = [
        parsed.cashRegisterId,
        parsed.CashRegisterId,
        (parsed.cashRegister as Record<string, unknown> | undefined)?.id,
      ];

      for (const candidate of candidates) {
        const numeric = toPositiveNumber(candidate);
        if (numeric) {
          return numeric;
        }
      }
    } catch {
      continue;
    }
  }

  return undefined;
};

const getFinanceHeaders = (cashRegisterId?: number) => {
  const resolvedCashRegisterId =
    toPositiveNumber(cashRegisterId) ?? getCashRegisterIdFromStorage();

  return getHeaders(resolvedCashRegisterId);
};

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
      headers: getFinanceHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      throw new Error(
        "Finance endpoint returned 404. Verify API base URL and cash register context.",
      );
    }

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
      headers: getFinanceHeaders(cashRegisterId),
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
      headers: getFinanceHeaders(cashRegisterId),
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
      headers: getFinanceHeaders(options?.cashRegisterId),
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
      headers: getFinanceHeaders(options?.cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch shop inventory status."),
    );
  }
};
