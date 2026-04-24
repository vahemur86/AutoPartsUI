// services
import api from "@/services";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  GetProfitReportParams,
  ProfitReportResponse,
  GetInventoryLotsReportParams,
  InventoryLotsReportResponse,
  DailyProfitReportResponse,
} from "@/types/warehouses/reports";
import { ROUTE_PAGE_KEYS } from "@/constants/pageKeys";

type HeadersType = {
  "X-CashRegister-Id": number;
  "X-Page-Key"?: string;
};

const performRequest = async <T>(
  requestFn: (headers: HeadersType) => Promise<{ data: T }>,
  cashRegisterId: number,
  defaultErrorMessage: string,
  pageKey?: string, // 👈 add this
): Promise<T> => {
  try {
    const headers: HeadersType = {
      "X-CashRegister-Id": cashRegisterId,
      ...(pageKey && { "X-Page-Key": pageKey }),
    };

    const response = await requestFn(headers);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, defaultErrorMessage));
  }
};

export const getProfitReport = ({
  cashRegisterId,
  ...params
}: GetProfitReportParams) =>
  performRequest(
    (headers) =>
      api.get<ProfitReportResponse>(`/admin/reports/profit`, {
        params,
        headers,
      }),
    cashRegisterId,
    "Failed to fetch profit report.",
  );

export const getDailyProfitReport = ({
  cashRegisterId,
  ...params
}: GetProfitReportParams) =>
  performRequest(
    (headers) =>
      api.get<DailyProfitReportResponse>(`/admin/reports/profit/daily`, {
        params,
        headers,
      }),
    cashRegisterId,
    "Failed to fetch profit report.",
  );

export const getInventoryLotsReport = ({
  id,
  cashRegisterId,
  status,
}: GetInventoryLotsReportParams) => {
  const pageKey = ROUTE_PAGE_KEYS.warehouse;

  return performRequest(
    (headers) =>
      api.get<InventoryLotsReportResponse>(
        `/admin/reports/${id}/inventory/lots`,
        {
          params: { status },
          headers,
        },
      ),
    cashRegisterId,
    "Failed to fetch inventory lots report.",
    pageKey,
  );
};
