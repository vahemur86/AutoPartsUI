import api from "@/services";
import { getHeaders } from "@/utils";
import type {
  ConfirmProductReturnLossRequest,
  CreateProductReturnRequest,
  InspectProductReturnRequest,
  ProductReturn,
} from "@/types/productReturns";

export const createProductReturn = async (
  saleId: number,
  request: CreateProductReturnRequest,
  cashRegisterId: number,
): Promise<ProductReturn> => {
  const response = await api.post<ProductReturn>(
    `/pos/sales/${saleId}/returns`,
    request,
    { headers: getHeaders(cashRegisterId) },
  );
  return response.data;
};

export const getProductReturns = async (
  saleId: number,
  cashRegisterId?: number,
): Promise<ProductReturn[]> => {
  const response = await api.get<ProductReturn[]>(
    `/pos/sales/${saleId}/returns`,
    { headers: getHeaders(cashRegisterId) },
  );
  return response.data;
};

export const inspectProductReturnItem = async (
  returnId: number,
  itemId: number,
  request: InspectProductReturnRequest,
): Promise<void> => {
  await api.post(
    `/pos/returns/${returnId}/items/${itemId}/inspection`,
    request,
  );
};

export const confirmProductReturnItemLoss = async (
  returnId: number,
  itemId: number,
  request: ConfirmProductReturnLossRequest,
): Promise<void> => {
  await api.post(
    `/pos/returns/${returnId}/items/${itemId}/loss-confirmation`,
    request,
  );
};

export const createProductReturnIdempotencyKey = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `product-return-${Date.now()}-${Math.random().toString(36).slice(2)}`;
