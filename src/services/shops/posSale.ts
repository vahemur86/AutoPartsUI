import api from "@/services";
import { getApiErrorMessage, getHeaders } from "@/utils";

export interface POSSaleItem {
  productId: number;
  shopStockId: number;
  quantity: number;
  unitPrice: number;
}

export interface POSSaleRequest {
  shopId: number;
  customerId?: number | null;
  discountAmount?: number;
  cashPaid: number;
  nonCashPaid: number;
  nonCashPaymentReference?: string;
  items: POSSaleItem[];
}

export interface POSSaleResponse {
  id: number;
  shopId: number;
  totalAmount: number;
  cashPaid: number;
  nonCashPaid: number;
  createdAt: string;
}

export const createPOSSale = async (
  request: POSSaleRequest,
  cashRegisterId: number,
): Promise<POSSaleResponse> => {
  try {
    const response = await api.post<POSSaleResponse>(`/POSSale`, request, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to complete sale."));
  }
};
