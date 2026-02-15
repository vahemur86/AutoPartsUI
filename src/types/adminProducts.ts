export interface PaginatedResponse<T> {
  totalItems: number;
  page: number;
  pageSize: number;
  results: T[];
}

export interface IronPurchase {
  id: number;
  productId: number;
  name: string; // Matches "name" in JSON
  weight: number;
  unitPricePerKg: number; // Matches "unitPricePerKg" in JSON
  totalAmount: number; // Matches "totalAmount" in JSON
  purchasedAt: string; // Matches "purchasedAt" in JSON
  operatorUserId: number;
  cashRegisterId: number;
  remark?: string; // Matches "remark" in JSON
}

export interface IronDropdownItem {
  id: number;
  displayName: string;
  unitPrice: number;
}

export interface BuyIronPayload {
  productId: number;
  weight: number;
}

export interface UpdateProductPricePayload {
  productId: number;
  unitPrice: number;
}

export interface OrderLinePayload {
  productId: number;
  weight: number;
}

export interface GetIronPurchasesParams {
  FromUtc?: string;
  ToUtc?: string;
  ProductId?: number;
  OperatorUserId?: number;
  CashRegisterId?: number;
  Page?: number;
  PageSize?: number;
  lang?: string;
}

// Added for consistency with your Batch/ZReport patterns
export type IronPurchaseResponse = PaginatedResponse<IronPurchase>;
