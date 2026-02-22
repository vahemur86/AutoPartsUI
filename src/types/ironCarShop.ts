export interface CarModel {
  id: number;
  name: string;
}

export interface IronType {
  id: number;
  name: string;
}

export interface IronTypePrice {
  ironTypeId: number;
  name: string;
  pricePerKg: number;
  weightKg: number;
  totalAmount: number;
}

export interface IronPricesResponse {
  items: IronTypePrice[];
  weightKgTotal: number;
  totalAmountTotal: number;
}

export interface BulkPurchaseItem {
  ironTypeId: number;
  weightKg: number;
}

export interface PurchaseIronPayload {
  customerId: number;
  ironTypeId: number;
  weightKg: number;
  customerTypeId: number;
}

export interface BulkPurchasePayload {
  customerId: number;
  customerTypeId: number;
  items: BulkPurchaseItem[];
}

export interface PurchaseIronResponse {
  purchaseId?: number;
  id?: number;
  customerId: number;
  customerPhone?: string;
  ironTypeId: number;
  ironTypeName: string;
  customerTypeId: number;
  weightKg: number;
  pricePerKg: number;
  totalAmount: number;
  purchasedAt: string;
}

export interface IronPrice {
  id: number;
  customerTypeId: number;
  pricePerKg: number;
}

export interface IronTypePriceByCustomer {
  customerTypeId: number;
  customerTypeName: string;
  pricePerKg: number;
}

export interface IronTypeByCar {
  ironTypeId: number;
  name: string;
  prices: IronTypePriceByCustomer[];
}

export interface AddIronPricePayload {
  id: number;
  customerTypeId: number;
  pricePerKg: number;
}

export interface CarModelPayload {
  code: string;
  translations: Record<string, string>;
}

export interface GetIronSalesParams {
  customerId?: number;
  lang?: string;
}
