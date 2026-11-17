export interface PowderPackageSourceItem {
  powderBatchItemId: number;
  intakeId: number;
  supplierClientName: string;
  powderKg: number;
  allocatedPowderKg: number;
  availablePowderKg: number;
  isSpecialCustomerLot: boolean;
  specialCustomerId: number | null;
  specialCustomerName: string | null;
  ptPerKg_g: number;
  pdPerKg_g: number;
  rhPerKg_g: number;
}

export interface PowderPackageSourceBatch {
  powderBatchId: number;
  sessionId: number;
  warehouseId: number;
  createdAt: string;
  totalPowderKg: number;
  availablePowderKg: number;
  items: PowderPackageSourceItem[];
}

export interface IronPowderPackageSourceBatch {
  ironProcessingBatchId: number;
  warehouseId: number;
  ironPurchaseId: number;
  sourceWeightKg: number;
  powderWeightKg: number;
  allocatedPowderKg: number;
  availablePowderKg: number;
  ptPerKg: number;
  pdPerKg: number;
  rhPerKg: number;
  totalCost: number;
  createdAt: string;
}

export interface PowderPackageItemRequest {
  powderBatchItemId: number;
  powderKg: number;
}

export interface CreatePowderPackageRequest {
  powderBatchId: number;
  sealNumber: string;
  items: PowderPackageItemRequest[];
}

export interface CreateIronPowderPackageRequest {
  ironProcessingBatchId: number;
  sealNumber: string;
  powderKg: number;
}

export interface PowderPackageItem {
  powderBatchItemId: number;
  intakeId: number;
  supplierClientName: string;
  powderKg: number;
  costAmd: number;
  isSpecialCustomerLot: boolean;
  specialCustomerId: number | null;
  specialCustomerName: string | null;
}

export interface PowderPackage {
  id: number;
  powderBatchId: number | null;
  warehouseId: number;
  sealNumber: string;
  totalPowderKg: number;
  costTotalAmd: number;
  ptPerKg_g: number;
  pdPerKg_g: number;
  rhPerKg_g: number;
  status: 1 | 2 | 3;
  createdAt: string;
  createdByUserId: number;
  sentAt: string | null;
  sentByUserId: number | null;
  items: PowderPackageItem[];
  sourceType?: string | null;
  ironProcessingBatchId?: number | null;
}
