export interface AvailableIronPurchase {
  purchaseId: number;
  customerId: number;
  customerName?: string | null;
  customerPhone?: string | null;
  dictBrandId: number;
  ironTypeId: number;
  customerTypeId: number;
  brand?: string;
  brandName?: string;
  ironType?: string;
  ironTypeName?: string;
  categoryId?: number | null;
  categoryName?: string | null;
  recalculationStep?: number | null;
  customerType?: string;
  customerTypeName?: string;
  purchasedWeightKg: number;
  totalPurchaseCost: number;
  transferredWeightKg: number;
  remainingWeightKg: number;
  purchasedAt: string;
}

export interface AvailableIronPurchasesSummary {
  totalPurchasedWeightKg: number;
  totalTransferredWeightKg: number;
  totalRemainingWeightKg: number;
  byIronType: Array<{
    id: number;
    name: string;
    purchasedWeightKg: number;
    transferredWeightKg: number;
    remainingWeightKg: number;
  }>;
  byCategory: Array<{
    id: number;
    name: string;
    purchasedWeightKg: number;
    transferredWeightKg: number;
    remainingWeightKg: number;
  }>;
}

export interface IronWarehouseTransfer {
  id: number;
  ironPurchaseId: number;
  ironTypeId?: number;
  ironTypeName?: string | null;
  warehouseId: number;
  warehouse?: string;
  warehouseName?: string;
  weightKg: number;
  unitCost: number;
  totalCost: number;
  transferredAt: string;
}

export interface IronWarehouseStock {
  purchaseId?: number;
  ironPurchaseId?: number;
  ironTypeName: string;
  purchasedWeightKg: number;
  transferredWeightKg: number;
  physicalSoldWeightKg: number;
  processingWeightKg: number;
  remainingWeightKg: number;
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

export interface BulkIronProcessingAllocation {
  ironPurchaseId: number;
  sourceWeightKg: number;
}

export interface IronProcessingAllocation extends BulkIronProcessingAllocation {
  unitCost: number;
  allocatedPurchaseCost: number;
}

export interface BulkProcessIronToPowderRequest {
  warehouseId: number;
  allocations: BulkIronProcessingAllocation[];
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
  allocations?: IronProcessingAllocation[];
}

export interface BulkProcessIronToPowderResponse {
  batch: IronProcessingBatch;
  allocations: IronProcessingAllocation[];
}

export interface IronPowderStockLot {
  id: number;
  warehouseId?: number;
  powderBatchId?: number;
  remainingPowderKg: number;
  remainingCostAmd?: number;
  initialPowderKg?: number;
  initialCostAmd?: number;
  remainingPt_g?: number;
  remainingPd_g?: number;
  remainingRh_g?: number;
  ptPerKg?: number;
  pdPerKg?: number;
  rhPerKg?: number;
  totalCost?: number;
  ironPurchaseId?: number;
  allocations?: IronProcessingAllocation[];
  sourceWeightKg?: number;
  powderWeightKg?: number;
  allocatedPurchaseCost?: number;
  processingExpenses?: number;
  status?: number;
  createdAt: string;
  updatedAt?: string;
  isSpecialCustomerLot?: boolean;
  specialCustomerId?: number | null;
  specialCustomerName?: string | null;
  sourceType?: "IronDerived" | "Catalyst" | string;
  processingBatchId?: number | null;
  containsIronPowder?: boolean;
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
  weightKg: number;
  unitSalePrice: number;
  extraExpenses: number;
}

export interface PhysicalIronSaleResponse extends PhysicalIronSaleRequest {
  id: number;
  ironTypeId: number;
  categoryId: number;
  unitCost: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  soldAt: string;
}

export interface BulkPhysicalIronSaleAllocation {
  ironPurchaseId: number;
  weightKg: number;
}

export interface BulkPhysicalIronSaleRequest {
  warehouseId: number;
  allocations: BulkPhysicalIronSaleAllocation[];
  unitSalePrice: number;
  extraExpenses: number;
}

export interface BulkPhysicalIronSaleResponse {
  id: number;
  warehouseId: number;
  ironTypeId: number;
  categoryId: number;
  weightKg: number;
  unitCost: number;
  extraExpenses: number;
  totalCost: number;
  unitSalePrice: number;
  totalRevenue: number;
  profit: number;
  soldAt: string;
  allocations: Array<BulkPhysicalIronSaleAllocation & {
    unitCost: number;
    allocatedCost: number;
    allocatedExpenses?: number;
  }>;
}

export interface PhysicalIronSaleReportItem extends Omit<BulkPhysicalIronSaleResponse, "allocations"> {
  allocations: BulkPhysicalIronSaleResponse["allocations"];
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