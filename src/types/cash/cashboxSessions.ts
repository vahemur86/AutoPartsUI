export interface PaginatedResponse<T> {
  totalItems: number;
  page: number;
  pageSize: number;
  results: T[];
}

export interface BatchItem {
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
  estimatedSalesAmd: number;
  expectedProfitAmd: number;
  offerIncreaseStepOrder: number;
  offerIncreasePercent: number;
  estimatedSalesAmdAtPurchase: number;
  estimatedSalesDiffPercent: number;
  liveProfitPercent: number;
  purchaseProfitAmd: number;
  purchaseProfitPercent: number;
  profitDiffAmd: number;
  profitDiffPercent: number;
  customerRealPercent: number;
  /**
   * True when the item was purchased from a special customer type
   * (PreventInventoryMerge = true) and must be isolated in its own batch.
   */
  customerTypeHasPreventMergeFlag?: boolean;
}

export interface Batch {
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
  costTotalAmd: number;
  status: number;
  createdAt: string;
  /**
   * Optional aggregate fields that are only returned
   * when filtering by client name / phone / type.
   */
  avgCustomerPercent?: number;
  avgFxRateToAmd?: number;
  avgPdPricePerKg?: number;
  avgPtPricePerKg?: number;
  avgRhPricePerKg?: number;
  totalCostAmd: number;
  totalEstimatedSalesAmd: number;
  totalPurchaseProfitAmd: number;
  totalLiveProfitAmd: number;
  totalProfitDiffAmd: number;
  totalLiveProfitPercent: number;
  /**
   * True when the batch contains special-customer (PreventInventoryMerge)
   * items and is isolated from normal batch merging.
   */
  hasPreventMergeItems?: boolean;
}

export interface BatchDetails extends Batch {
  items: BatchItem[];
}

/**
 * Session-level batch details: one entry per batch.
 * Prevent-merge (special-customer) items are isolated into their own
 * batches, so a session may have multiple batches.
 */
export type SessionBatchDetails = BatchDetails[];

export interface CloseSessionResult {
  report: ZReport;
  batches: Batch[];
}

export interface ZReport {
  id: number;
  sessionId: number;
  cashBoxId: number;
  operatorUserId: number;
  openedAt: string;
  closedAt: string;
  intakeCount: number;
  totalPurchasesAmd: number;
  totalCashInAmd: number;
  totalCashOutAmd: number;
  catalystCashOutAmd: number;
  ironCashOutAmd: number;
  diffPurchasesVsCashOutAmd: number;
}

export interface CashboxReport {
  cashBoxId: number;
  date: string;
  openingBalanceAmd: number;
  cashInAmd: number;
  cashOutAmd: number;
  expectedClosingBalanceAmd: number;
}

export interface BatchResponse extends PaginatedResponse<Batch> {
  /**
   * Optional aggregate totals returned by the server
   * when filtering by supplierClientId (special-customer-only mode).
   */
  totalPowderKg?: number;
  totalCostAmd?: number;
  avgPtPerKg_g?: number;
  avgPdPerKg_g?: number;
  avgRhPerKg_g?: number;
}
export type ZReportResponse = PaginatedResponse<ZReport>;
