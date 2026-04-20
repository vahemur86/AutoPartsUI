export interface BaseLot {
  id: number;
  warehouseId: number;
  status: number;
  totalPowderKg: number;
  itemsCostTotalAmd: number;
  profitAmd: number;
  costTotalAmd: number;
  ptTotal_g: number;
  pdTotal_g: number;
  rhTotal_g: number;
  createdAt: string;
  soldAt: string | null;
}

export interface LotItem {
  id: number;
  inventoryLotId: number;
  powderKg: number;
  costPartAmd: number;
  pt_g: number;
  pd_g: number;
  rh_g: number;
}

export interface GetSalesLotsParams {
  warehouseId?: number;
  status?: number;
  page?: number;
  pageSize?: number;
  cashRegisterId: number;
}

export interface CreateSalesLotItem {
  inventoryLotId: number;
  powderKg: number;
}

export interface CreateSalesLotRequest {
  warehouseId: number;
  items: CreateSalesLotItem[];
  cashRegisterId: number;
}

export interface SellSalesLotRequest {
  id: number;
  cashRegisterId: number;
  body: {
    currencyCode: string;
    oldRevenue: number;
    ptPrice: number;
    pdPrice: number;
    rhPrice: number;
    powderKg: number;
    pt_g: number;
    pd_g: number;
    rh_g: number;
  };
}

export interface PaginatedResponse<T> {
  totalItems: number;
  page: number;
  pageSize: number;
  results: T[];
}

export type GetSalesLotsResponse = PaginatedResponse<BaseLot>;

export interface GetLotDetailsResponse {
  lot: BaseLot;
  items: LotItem[];
}

export interface SellSalesLotResponse {
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

export interface SalesLotPreviewItem {
  inventoryLotId: number;
  powderKg: number;
  costPartAmd: number;
  ptPerKg_g: number;
  pdPerKg_g: number;
  rhPerKg_g: number;
}

export interface SalesLotPreviewRequest {
  warehouseId: number;
  items: Array<{
    inventoryLotId: number;
    powderKg: number;
  }>;
  cashRegisterId: number;
}

export interface SalesLotPreviewResponse {
  items: SalesLotPreviewItem[];
  totalPowderKg: number;
  totalCost: number;
  totalCostAmd: number;
  totalRevenueAmd: number;
  ptTotal_g: number;
  pdTotal_g: number;
  rhTotal_g: number;
  createdLotId: number | null;
}

export interface PowderSaleAdjustments {
  id: number;
  powderSaleId: number;
  oldAmount: number;
  newAmount: number;
  difference: number;
  currencyCode: string;
  oldAmountAmd: number;
  newAmountAmd: number;
  differenceAmd: number;
  exchangeRate: number;
  reason: string;
  createdAt: string;
}

export type GetPowderSalesAdjustmentsResponse =
  PaginatedResponse<PowderSaleAdjustments>;

export interface ReconcilePowderSaleRequest {
  id: number;
  cashRegisterId: number;
  body: {
    finalAmount: number;
    reason: string;
  };
}
export interface SalesLotsSellFormResponse {
  powderKg: number;
  pt_g: number;
  pd_g: number;
  rh_g: number;
  ptPrice: number;
  pdPrice: number;
  rhPrice: number;
  usdRate: number;
  revenueAmd: number;
}
export interface SellRecalculationResponse {
  id: number;
  cashRegisterId: number;
  body: {
    currencyCode: string;
    ptPrice: number;
    pdPrice: number;
    rhPrice: number;
    powderKg: number;
    pt_g: number;
    pd_g: number;
    rh_g: number;
  };
}

export interface LotPreviewValues {
  powderKg: number;
  pt_g: number;
  pd_g: number;
  rh_g: number;
  ptPrice: number;
  pdPrice: number;
  rhPrice: number;
  usdRate: number;
  revenueAmd: number;
}

export interface LotPreviewDiff {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface GetLotPreviewResponse {
  saleId: number;
  before: LotPreviewValues;
  after: LotPreviewValues;
  diffs: LotPreviewDiff[];
}
export interface SalesLotsCalculatorRequest {
  cashRegisterId: number;
  powderKg: number;
  pt_g: number;
  pd_g: number;
  rh_g: number;
  customerBonusPercent: number;
  minProfitMarginPercent: number;
  priceMode: number;
  ptPrice: number;
  pdPrice: number;
  rhPrice: number;
  usdRate: number;
}

export interface SalesLotsCalculatorResponse {
  kitcoAmd: number;
  finalBaseAmd: number;
  customerOfferAmd: number;
  customerPercent: number;
  maxCustomerPercent: number;
  profitAmd: number;
  profitPercent: number;
}
