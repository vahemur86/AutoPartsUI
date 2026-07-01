import api from "./index";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";
import { AxiosError } from "axios";
import type {
  DashboardReportResponse,
  SalesRevenueByEmployeeItem,
  SalesRevenueByPaymentMethodItem,
  SalesRevenueByPeriodItem,
  SalesRevenueFullResponse,
  ServiceEstimateReportResponse,
  ShopReportDateRangeParams,
  ShopReportInventoryAllProductsResponse,
  ShopReportInventoryResponse,
  ShopReportProductMetric,
  ShopReportSummaryResponse,
  WarehouseFullReportResponse,
  WarehouseMovementItem,
  WarehousePurchaseItem,
  WarehouseStockResponse,
  WarehouseTurnoverItem,
  WarehouseVelocityItem,
} from "@/types/financeReports";

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

export const getShopReportSummary = async (
  shopId: number,
  params?: ShopReportDateRangeParams & { cashRegisterId?: number },
): Promise<ShopReportSummaryResponse> => {
  try {
    const query = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/shop/${shopId}/summary${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });

    return response.data as ShopReportSummaryResponse;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch shop report summary."),
    );
  }
};

export const getShopBestSellingProducts = async (
  shopId: number,
  params?: ShopReportDateRangeParams & { take?: number; cashRegisterId?: number },
): Promise<ShopReportProductMetric[]> => {
  try {
    const query = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      take: params?.take ?? 10,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(
      `/admin/reports/shop/${shopId}/best-selling-products${suffix}`,
      {
        headers: getFinanceHeaders(params?.cashRegisterId),
      },
    );

    return response.data as ShopReportProductMetric[];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch best selling products."),
    );
  }
};

export const getShopHighestProfitProducts = async (
  shopId: number,
  params?: ShopReportDateRangeParams & { take?: number; cashRegisterId?: number },
): Promise<ShopReportProductMetric[]> => {
  try {
    const query = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      take: params?.take ?? 10,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(
      `/admin/reports/shop/${shopId}/highest-profit-products${suffix}`,
      {
        headers: getFinanceHeaders(params?.cashRegisterId),
      },
    );

    return response.data as ShopReportProductMetric[];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch highest profit products."),
    );
  }
};

export const getShopInventoryReport = async (
  shopId: number,
  params?: { lowStockThreshold?: number; cashRegisterId?: number },
): Promise<ShopReportInventoryResponse> => {
  try {
    const query = buildQuery({
      lowStockThreshold: params?.lowStockThreshold ?? 5,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/shop/${shopId}/inventory${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });

    return response.data as ShopReportInventoryResponse;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch shop inventory report."),
    );
  }
};

export const getShopInventoryAllProductsReport = async (
  shopId: number,
  params?: { cashRegisterId?: number },
): Promise<ShopReportInventoryAllProductsResponse> => {
  try {
    const response = await api.get(`/admin/reports/shop/${shopId}/inventory/all-products`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });

    return response.data as ShopReportInventoryAllProductsResponse;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch all shop inventory products."),
    );
  }
};

export const getServiceEstimateReport = async (
  params?: {
    shopId?: number;
    serviceCategoryId?: number;
    fromDate?: string;
    toDate?: string;
    pageNumber?: number;
    pageSize?: number;
    cashRegisterId?: number;
  },
): Promise<ServiceEstimateReportResponse> => {
  try {
    const query = buildQuery({
      shopId: params?.shopId,
      serviceCategoryId: params?.serviceCategoryId,
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 50,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/ServiceEstimate/report${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });

    return response.data as ServiceEstimateReportResponse;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch service estimate report."),
    );
  }
};

export const getServiceEstimateAnalytics = async (
  params?: {
    shopId?: number;
    fromDate?: string;
    toDate?: string;
    topN?: number;
    cashRegisterId?: number;
  },
) => {
  try {
    const query = buildQuery({
      shopId: params?.shopId,
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      topN: params?.topN ?? 10,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/ServiceEstimate/analytics${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch service estimate analytics."),
    );
  }
};

export const getWarehouseReportStock = async (
  warehouseId: number,
  params?: { cashRegisterId?: number },
): Promise<WarehouseStockResponse> => {
  try {
    const response = await api.get(`/admin/reports/warehouse/${warehouseId}/stock`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });
    return response.data as WarehouseStockResponse;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch warehouse stock report."));
  }
};

export const getWarehouseReportMovements = async (
  warehouseId: number,
  params?: ShopReportDateRangeParams & { cashRegisterId?: number },
): Promise<WarehouseMovementItem[]> => {
  try {
    const query = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/warehouse/${warehouseId}/movements${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });
    return response.data as WarehouseMovementItem[];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch warehouse movements report."));
  }
};

export const getWarehouseReportPurchases = async (
  warehouseId: number,
  params?: ShopReportDateRangeParams & { cashRegisterId?: number },
): Promise<WarehousePurchaseItem[]> => {
  try {
    const query = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/warehouse/${warehouseId}/purchases${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });
    return response.data as WarehousePurchaseItem[];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch warehouse purchases report."));
  }
};

export const getWarehouseReportFastMoving = async (
  warehouseId: number,
  params?: ShopReportDateRangeParams & { take?: number; cashRegisterId?: number },
): Promise<WarehouseVelocityItem[]> => {
  try {
    const query = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      take: params?.take,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/warehouse/${warehouseId}/fast-moving${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });
    return response.data as WarehouseVelocityItem[];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch warehouse fast-moving report."));
  }
};

export const getWarehouseReportSlowMoving = async (
  warehouseId: number,
  params?: ShopReportDateRangeParams & {
    notSoldForDays?: number;
    take?: number;
    cashRegisterId?: number;
  },
): Promise<WarehouseVelocityItem[]> => {
  try {
    const query = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      notSoldForDays: params?.notSoldForDays,
      take: params?.take,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/warehouse/${warehouseId}/slow-moving${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });
    return response.data as WarehouseVelocityItem[];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch warehouse slow-moving report."));
  }
};

export const getWarehouseReportNotSold = async (
  warehouseId: number,
  params?: ShopReportDateRangeParams & { cashRegisterId?: number },
): Promise<WarehouseVelocityItem[]> => {
  try {
    const query = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/warehouse/${warehouseId}/not-sold${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });
    return response.data as WarehouseVelocityItem[];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch warehouse not-sold report."));
  }
};

export const getWarehouseReportTurnover = async (
  warehouseId: number,
  params?: ShopReportDateRangeParams & { cashRegisterId?: number },
): Promise<WarehouseTurnoverItem[]> => {
  try {
    const query = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/warehouse/${warehouseId}/turnover${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });
    return response.data as WarehouseTurnoverItem[];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch warehouse turnover report."));
  }
};

export const getWarehouseReportFull = async (
  warehouseId: number,
  params?: ShopReportDateRangeParams & {
    topN?: number;
    slowMovingDays?: number;
    cashRegisterId?: number;
  },
): Promise<WarehouseFullReportResponse> => {
  try {
    const query = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      topN: params?.topN ?? 20,
      slowMovingDays: params?.slowMovingDays,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/warehouse/${warehouseId}/full${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });
    return response.data as WarehouseFullReportResponse;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch warehouse full report."));
  }
};

export const getSalesRevenueReport = async (
  params?: ShopReportDateRangeParams & {
    groupBy?: number;
    shopId?: number;
    cashRegisterId?: number;
  },
): Promise<SalesRevenueByPeriodItem[]> => {
  try {
    const query = buildQuery({
      groupBy: params?.groupBy ?? 0,
      shopId: params?.shopId,
      fromDate: params?.fromDate,
      toDate: params?.toDate,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/sales/revenue${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });
    return response.data as SalesRevenueByPeriodItem[];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch sales revenue report."));
  }
};

export const getSalesRevenueByEmployee = async (
  params?: ShopReportDateRangeParams & {
    shopId?: number;
    cashRegisterId?: number;
  },
): Promise<SalesRevenueByEmployeeItem[]> => {
  try {
    const query = buildQuery({
      shopId: params?.shopId,
      fromDate: params?.fromDate,
      toDate: params?.toDate,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/sales/revenue/by-employee${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });
    return response.data as SalesRevenueByEmployeeItem[];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch sales revenue by employee."));
  }
};

export const getSalesRevenueByPaymentMethod = async (
  params?: ShopReportDateRangeParams & {
    shopId?: number;
    cashRegisterId?: number;
  },
): Promise<SalesRevenueByPaymentMethodItem[]> => {
  try {
    const query = buildQuery({
      shopId: params?.shopId,
      fromDate: params?.fromDate,
      toDate: params?.toDate,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/sales/revenue/by-payment-method${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });
    return response.data as SalesRevenueByPaymentMethodItem[];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch sales revenue by payment method."));
  }
};

export const getSalesRevenueFull = async (
  params?: ShopReportDateRangeParams & {
    groupBy?: number;
    shopId?: number;
    cashRegisterId?: number;
  },
): Promise<SalesRevenueFullResponse> => {
  try {
    const query = buildQuery({
      groupBy: params?.groupBy ?? 0,
      shopId: params?.shopId,
      fromDate: params?.fromDate,
      toDate: params?.toDate,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/reports/sales/revenue/full${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });
    return response.data as SalesRevenueFullResponse;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch full sales revenue report."));
  }
};

export const getAdminDashboardReport = async (
  params?: {
    shopId?: number;
    warehouseId?: number;
    lowStockThreshold?: number;
    cashRegisterId?: number;
  },
): Promise<DashboardReportResponse> => {
  try {
    const query = buildQuery({
      shopId: params?.shopId,
      warehouseId: params?.warehouseId,
      lowStockThreshold: params?.lowStockThreshold,
    });
    const suffix = query ? `?${query}` : "";

    const response = await api.get(`/admin/dashboard${suffix}`, {
      headers: getFinanceHeaders(params?.cashRegisterId),
    });

    return response.data as DashboardReportResponse;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch admin dashboard report."));
  }
};
