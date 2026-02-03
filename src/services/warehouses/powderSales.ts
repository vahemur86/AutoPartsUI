// services
import api from "@/services";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  GetPowderSalesParams,
  GetPowderSalesResponse,
} from "@/types/warehouses/powderSales";

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

export const getPowderSales = ({
  cashRegisterId,
  ...params
}: GetPowderSalesParams) =>
  performRequest(
    (headers) =>
      api.get<GetPowderSalesResponse>(`/admin/powder-sales`, {
        params,
        headers,
      }),
    cashRegisterId,
    "Failed to get powder sales.",
  );

