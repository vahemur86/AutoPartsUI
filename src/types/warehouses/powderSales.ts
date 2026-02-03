import type { PaginatedResponse } from "./salesLots";

export interface GetPowderSalesParams {
  warehouseId?: number;
  fromUtc?: string;
  toUtc?: string;
  page?: number;
  pageSize?: number;
  cashRegisterId: number;
}

export interface PowderSale {
  id: number;
  salesLotId: number;
  warehouseId: number;
  currencyCode: string;
  revenueTotal: number;
  revenueTotalAmd: number;
  costAmd: number;
  profitAmd: number;
  soldPowderKg: number;
  createdAt: string;
}

export type GetPowderSalesResponse = PaginatedResponse<PowderSale>;

