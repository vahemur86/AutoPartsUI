export interface AvailableIronPurchase {
  purchaseId: number;
  customerId: number;
  dictBrandId: number;
  ironTypeId: number;
  customerTypeId: number;
  brand?: string;
  brandName?: string;
  ironType?: string;
  ironTypeName?: string;
  customerType?: string;
  customerTypeName?: string;
  purchasedWeightKg: number;
  totalPurchaseCost: number;
  transferredWeightKg: number;
  remainingWeightKg: number;
  purchasedAt: string;
}

export interface IronWarehouseTransfer {
  id: number;
  ironPurchaseId: number;
  warehouseId: number;
  warehouse?: string;
  warehouseName?: string;
  weightKg: number;
  unitCost: number;
  totalCost: number;
  transferredAt: string;
}

export interface ProcessIronToPowderRequest {
  warehouseId: number;
  ironPurchaseId: number;
  sourceWeightKg: number;
  powderWeightKg: number;
  ptPerKg: number;
  pdPerKg: number;
  rhPerKg: number;
  processingExpenses: number;
}

export interface IronProcessingBatch {
  id: number;
  warehouseId: number;
  ironPurchaseId: number;
  sourceWeightKg: number;
  powderWeightKg: number;
  remainingPowderKg: number;
  ptPerKg: number;
  pdPerKg: number;
  rhPerKg: number;
  allocatedPurchaseCost: number;
  processingExpenses: number;
  totalCost: number;
  createdAt: string;
}

export interface IronPowderStockLot {
  id: number;
  warehouseId?: number;
  powderBatchId: number;
  remainingPowderKg: number;
  remainingCostAmd: number;
  initialPowderKg: number;
  initialCostAmd: number;
  remainingPt_g: number;
  remainingPd_g: number;
  remainingRh_g: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  isSpecialCustomerLot: boolean;
  specialCustomerId: number | null;
  specialCustomerName: string | null;
  sourceType: "IronDerived" | "Catalyst" | string;
  processingBatchId: number | null;
  containsIronPowder: boolean;
}

export interface IronPowderProfitReport {
  physicalIronRevenue: number;
  physicalIronCost: number;
  physicalIronProfit: number;
  powderRevenue: number;
  powderCost: number;
  powderProfit: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  physicalIronSoldWeightKg: number;
  powderSoldWeightKg: number;
}

export interface PhysicalIronSaleRequest {
  warehouseId: number;
  ironPurchaseId: number;
  ironTypeId: number;
  categoryId: number;
  weightKg: number;
  unitSalePrice: number;
  extraExpenses: number;
}

export interface PhysicalIronSaleResponse extends PhysicalIronSaleRequest {
  id: number;
  unitCost: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  soldAt: string;
}

export interface IronPowderSaleRequest {
  ironProcessingBatchId: number;
  warehouseId: number;
  powderWeightKg: number;
  unitSalePrice: number;
  extraExpenses: number;
}

export interface IronPowderSaleResponse extends IronPowderSaleRequest {
  id: number;
  unitCost: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  soldAt: string;
}