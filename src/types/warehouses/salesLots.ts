export interface BaseLot {
  id: number;
  warehouseId: number;
  status: number;
  totalPowderKg: number;
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
