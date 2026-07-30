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
  isSpecialCustomerLot?: boolean;
  specialCustomerId?: number;
}

export interface ProfitReportResponse {
  revenueAmd: number;
  costAmd: number;
  profitAmd: number;
  soldPowderKg: number;
}

export type DailyProfitReportResponse = DailyProfitReportItem[];

export interface DailyProfitReportItem {
  date: string;
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
  isSpecialCustomerLot?: boolean;
  specialCustomerId?: number | null;
  specialCustomerName?: string | null;
}

export type InventoryLotsReportResponse = InventoryLot[];

export interface GetSpecialLotsReportParams {
  fromDate?: string;
  toDate?: string;
  warehouseId?: number;
  cashRegisterId: number;
}

export interface SpecialCustomerBreakdown {
  specialCustomerId: number;
  specialCustomerName: string;
  totalLotsCount: number;
  totalPowderKg: number;
  totalCostAmd: number;
  remainingPowderKg: number;
  remainingCostAmd: number;
  revenueAmd: number;
  profitAmd: number;
}

export interface SpecialLotsReportResponse {
  totalSpecialLotsCreated: number;
  uniqueSpecialCustomersCount: number;
  totalSpecialPowderKg: number;
  totalSpecialCostAmd: number;
  remainingSpecialPowderKg: number;
  remainingSpecialCostAmd: number;
  byCustomer: SpecialCustomerBreakdown[];
  reportFromDate: string;
  reportToDate: string;
}
