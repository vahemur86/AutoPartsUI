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
} from "@/types/warehouses/reports";

const performRequest = async <T>(
  requestFn: (headers: { "X-CashRegister-Id": number }) => Promise<{ data: T }>,
  cashRegisterId: number,
  defaultErrorMessage: string,
): Promise<T> => {
  try {
    const response = await requestFn({ "X-CashRegister-Id": cashRegisterId });
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

export const getInventoryLotsReport = ({
  id,
  cashRegisterId,
  status,
}: GetInventoryLotsReportParams) =>
  performRequest(
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
  );
