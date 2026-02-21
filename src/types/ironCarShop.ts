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
  ironTypeId: number;
  ironTypeName: string;
  customerTypeId: number;
  weightKg: number;
  pricePerKg: number;
  totalAmount: number;
  purchasedAt: string;
}
