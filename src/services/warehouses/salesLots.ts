// services
import api from "@/services";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  CreateSalesLotRequest,
  GetLotDetailsResponse,
  GetSalesLotsParams,
  GetSalesLotsResponse,
  SellSalesLotRequest,
  SellSalesLotResponse,
} from "@/types/warehouses/salesLots";

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

export const getSalesLots = ({
  cashRegisterId,
  ...params
}: GetSalesLotsParams) =>
  performRequest(
    (headers) =>
      api.get<GetSalesLotsResponse>(`/admin/sales-lots`, { params, headers }),
    cashRegisterId,
    "Failed to get sales lots.",
  );

export const getSalesLot = (id: number, cashRegisterId: number) =>
  performRequest(
    (headers) =>
      api.get<GetLotDetailsResponse>(`/admin/sales-lots/${id}`, { headers }),
    cashRegisterId,
    "Failed to get lot details.",
  );

export const createSalesLot = ({
  cashRegisterId,
  ...body
}: CreateSalesLotRequest) =>
  performRequest(
    (headers) => api.post<number>(`/admin/sales-lots`, body, { headers }),
    cashRegisterId,
    "Failed to create sales lot.",
  );

export const sellSalesLot = ({
  id,
  cashRegisterId,
  body,
}: SellSalesLotRequest) =>
  performRequest(
    (headers) =>
      api.post<SellSalesLotResponse>(`/admin/sales-lots/${id}/sell`, body, {
        headers,
      }),
    cashRegisterId,
    "Failed to complete sales lot transaction.",
  );
