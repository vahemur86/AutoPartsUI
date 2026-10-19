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
  dictBrandId?: number;
  brandName?: string;
  ironTypeId: number;
  name: string;
  pricePerKg: number;
  weightKg: number;
  totalAmount: number;
  customerTypeId?: number;
  categoryId?: number | null;
  categoryName?: string | null;
  isPriceConfigured?: boolean;
  hasRecalculateSteps?: boolean;
  recalculateStepCount?: number;
  recalculationStep?: number | null;
  notes?: string;
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
  dictBrandId?: number;
  categoryId?: number;
  ironTypeId: number;
  customerPhone: string;
  customerTypeId: number;
  weightKg: number;
  recalculationStep?: number | null;
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
  FromUtc?: string;
  ToUtc?: string;
  ProductId?: number;
  OperatorUserId?: number;
  CashRegisterId?: number;
  Page?: number;
  PageSize?: number;
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
  dictBrandId?: number;
  categoryId?: number;
  customerId: number;
  customerTypeId: number;
  currentStep: number;
  items: Record<string, number>;
}

export interface RecalculateResponse {
  currentStep: number;
  nextStep: number;
  appliedStep: number;
  isLastStep: boolean;
  totalWeight: number;
  totalAmount: number;
  items: Array<{
    dictBrandId?: number;
    categoryId?: number;
    ironTypeId: number;
    weightKg: number;
    pricePerKg: number | null;
    totalAmount: number;
    recalculationStep?: number | null;
    appliedRecalculationStep?: number | null;
  }>;
}

export interface IronCategoryBrand {
  dictBrandId: number;
  dictBrandCode: string;
}

export interface IronCategoryPrice {
  id: number;
  ironTypeId: number;
  customerTypeId: number;
  pricePerKg: number;
}

export interface IronCategory {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  brands: IronCategoryBrand[];
  prices: IronCategoryPrice[];
}

export interface IronCategoryPayload {
  code: string;
  name: string;
  isActive?: boolean;
  dictBrandIds: number[];
}

export interface IronCategoryPricePayload {
  ironTypeId: number;
  customerTypeId: number;
  pricePerKg: number;
}

export interface UpdateIronCategoryPricesPayload {
  prices: Array<{
    priceId: number;
    pricePerKg: number;
  }>;
}

export interface OperatorBrandIronType {
  ironTypeId: number;
  dictBrandId?: number;
  dictBrandName?: string;
  ironTypeCode?: string;
  ironTypeName?: string;
  name?: string;
  code?: string;
  pricePerKg?: number | null;
  isPriceConfigured?: boolean;
  hasRecalculateSteps?: boolean;
  recalculateStepCount?: number;
  categoryId?: number | null;
  categoryName?: string | null;
  prices?: Array<{
    customerTypeId: number;
    pricePerKg: number | null;
  }>;
}
