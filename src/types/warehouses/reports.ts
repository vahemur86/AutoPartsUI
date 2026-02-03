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

export interface InventoryLot {
  id: number;
  powderBatchId: number;
  remainingPowderKg: number;
  remainingCostAmd: number;
  remainingPt_g: number;
  remainingPd_g: number;
  remainingRh_g: number;
  initialPowderKg: number;
  initialCostAmd: number;
  initialPt_g: number;
  initialPd_g: number;
  initialRh_g: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export type InventoryLotsReportResponse = InventoryLot[];
