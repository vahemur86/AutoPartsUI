export interface CarModel {
  id: number;
  name: string;
}

export interface IronType {
  id: number;
  name: string;
  code?: string;
  translations?: Record<string, string>;
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

export interface PurchaseIronApiPayload {
  dictBrandId: number;
  ironTypeId: number;
  customerPhone: string;
  customerTypeId: number;
  weightKg: number;
  notes: string;
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
  code?: string;
  translations?: Record<string, string>;
  prices: {
    customerTypeId: number;
    customerTypeName: string;
    pricePerKg: number;
  }[];
}

export interface AddIronPricePayload {
  id: number;
  customerTypeId: number;
  pricePerKg: number;
}

export interface IronTypePriceUpdate {
  ironTypeId: number;
  customerTypeId: number;
  pricePerKg: number;
}

export interface UpdateIronTypePricesPayload {
  carModelId: number;
  priceUpdates: IronTypePriceUpdate[];
}

export interface CarModelPayload {
  code: string;
  translations: Record<string, string>;
}

export interface GetIronSalesParams {
  customerId?: number;
  lang?: string;
}

export interface GetIronPurchasesReportParams {
  from?: string;
  to?: string;
  dictBrandId?: number;
  ironTypeId?: number;
  operatorUserId?: number;
  sessionId?: number;
  customerPhone?: string;
  page?: number;
  pageSize?: number;
  lang?: string;
}

export interface IronPurchasesReportItem {
  purchaseId?: number;
  id?: number;
  dictBrandId?: number;
  brandName?: string;
  ironTypeId?: number;
  ironTypeName?: string;
  operatorUserId?: number;
  sessionId?: number;
  customerPhone?: string;
  customerTypeId?: number;
  weightKg?: number;
  pricePerKg?: number;
  totalAmount?: number;
  purchasedAt?: string;
}

export interface IronPurchasesReportResponse {
  items: IronPurchasesReportItem[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export interface RecalculateStepPayload {
  ironTypeId: number;
  customerTypeId: number;
  pricePerKg: number;
}

export interface RecalculatePayload {
  customerId: number;
  customerTypeId: number;
  currentStep: number;
  items: Record<string, number>;
}

export interface RecalculateResponse {
  currentStep: number;
  nextStep: number;
  isLastStep: boolean;
  totalWeight: number;
  totalAmount: number;
  items: Array<{
    ironTypeId: number;
    weightKg: number;
    pricePerKg: number;
    totalAmount: number;
  }>;
}
