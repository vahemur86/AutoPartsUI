import type { BaseLot } from "./salesLots";

export interface GetProfitReportParams {
  warehouseId?: number;
  fromUtc?: string;
  toUtc?: string;
  cashRegisterId: number;
}

export interface GetInventoryLotsReportParams {
  id: number;
  status?: number;
  cashRegisterId: number;
}

export interface ProfitReportResponse {
  revenueAmd: number;
  costAmd: number;
  profitAmd: number;
  soldPowderKg: number;
}

export type InventoryLotsReportResponse = BaseLot[];
