export interface OpenSession {
  sessionId: number;
  cashBoxId: number;
  cashBoxCode: string;
  operatorUserId: number;
  operatorUsername: string;
  openedAt: string;
}

export interface OpenSessionSummary extends OpenSession {
  intakesOfferedCount: number;
  intakesAcceptedCount: number;
  acceptedPowderKg: number;
  purchasesAmd: number;
  cashInAmd: number;
  cashOutAmd: number;
  diffAmd: number;
  lastActivityAt: string;
}

export interface PowderBatchItem {
  id: number;
  intakeId: number;
  powderKg: number;
  ptTotal_g: number;
  pdTotal_g: number;
  rhTotal_g: number;
}

export interface PowderBatchesSummary {
  totalPowderKg: number;
  ptTotal_g: number;
  pdTotal_g: number;
  rhTotal_g: number;
  ptPerKg_g: number;
  pdPerKg_g: number;
  rhPerKg_g: number;
  batchCount: number;
  avgCustomerPercent: number;
  avgFxRateToAmd: number;
  avgPdPricePerKg: number;
  avgPtPricePerKg: number;
  avgRhPricePerKg: number;
}

export interface PowderBatch {
  id: number;
  sessionId: number;
  cashBoxId: number;
  intakeCount: number;
  totalPowderKg: number;
  ptTotal_g: number;
  pdTotal_g: number;
  rhTotal_g: number;
  ptPerKg_g: number;
  pdPerKg_g: number;
  rhPerKg_g: number;
  avgCustomerPercent: number;
  avgFxRateToAmd: number;
  avgPdPricePerKg: number;
  avgPtPricePerKg: number;
  avgRhPricePerKg: number;
  status: number;
  createdAt: string;
}

export interface PowderBatchDetails extends PowderBatch {
  items: PowderBatchItem[];
}

export type PowderBatchResponse =
  import("./cashboxSessions").PaginatedResponse<PowderBatch>;

export type GetPowderBatchesParams = {
  fromDate?: string;
  toDate?: string;
  cashRegisterId: number;
  page?: number;
  pageSize?: number;
};
export interface GetBatchDetailsForFilterParams {
  fromDate?: string;
  toDate?: string;
  supplierClientId?: number;
  clientPhone?: string;
  clientTypeId?: number;
  cashRegisterId: number;
  page?: number;
  pageSize?: number;
}

export interface BatchDetailsForFilterItem {
  id: number;
  intakeId: number;
  powderKg: number;
  ptPerKg_g: number;
  pdPerKg_g: number;
  rhPerKg_g: number;
  ptPricePerKg: number;
  pdPricePerKg: number;
  rhPricePerKg: number;
  supplierClientId: number;
  supplierClientName: string;
  supplierClientPhone: string;
  supplierClientType: string;
  supplierClientTypePercent: number;
  fxRateToAmd: number;
  costAmd: number;
  offerIncreaseStepOrder: number | null;
  offerIncreasePercent: number | null;
  estimatedSalesAmd: number;
  expectedProfitAmd: number;
  estimatedSalesAmdAtPurchase: number;
  estimatedSalesDiffPercent: number;
  liveProfitPercent: number;
  purchaseProfitAmd: number;
  purchaseProfitPercent: number;
  profitDiffAmd: number;
  profitDiffPercent: number;
  customerRealPercent: number;
}

export interface BatchDetailsForFilterResponse {
  totalItems: number;
  page: number;
  pageSize: number;

  totalPowderKg: number;
  totalCostAmd: number;

  avgPtPerKg_g: number;
  avgPdPerKg_g: number;
  avgRhPerKg_g: number;

  items: BatchDetailsForFilterItem[];
}

export type BatchDetailsForFilter = BatchDetailsForFilterResponse;
