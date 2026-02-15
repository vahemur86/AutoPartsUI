export interface IronPurchase {
  id: number;
  productId: number;
  weight: number;
  unitPrice: number;
  totalPrice: number;
  operatorUserId: number;
  cashRegisterId: number;
  createdAt: string;
  productName?: string;
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
