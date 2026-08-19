export interface CatalyticConverterCompatibility {
  vehicleDefinitionId?: number | null;
  brandId?: number | null;
  modelId?: number | null;
  engineId?: number | null;
  fuelTypeId?: number | null;
  enginePowerHp?: number | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  maxMileageKm?: number | null;
}

export interface CatalyticConverterCompatibilityDetails
  extends CatalyticConverterCompatibility {
  id?: number;
  brandName?: string | null;
  modelName?: string | null;
  engineName?: string | null;
  fuelTypeName?: string | null;
}

export interface CreateCatalyticConverterRequest {
  code: string;
  description?: string | null;
  sellingPrice?: number | null;
  compatibilities?: CatalyticConverterCompatibility[];
}

export interface UpdateCatalyticConverterRequest {
  code: string;
  description?: string | null;
  sellingPrice?: number | null;
  compatibilities?: CatalyticConverterCompatibility[];
}

export interface CatalyticConverterSupplierLookup {
  id: number;
  fullName: string;
  phone: string;
  displayName: string;
  notes?: string | null;
}

export interface CatalyticConverterSupplier {
  id: number;
  fullName: string;
  phone: string;
  notes?: string | null;
}

export interface CreateCatalyticConverterSupplierRequest {
  phone: string;
  fullName: string;
  notes?: string | null;
}

export interface UpdateCatalyticConverterSupplierRequest {
  phone: string;
  fullName: string;
  notes?: string | null;
}

export interface CreateCatalyticPurchaseRequest {
  supplierId: number;
  catalyticConverterId: number;
  quantity: number;
  purchasePrice: number;
  warehouseId: number;
  purchasedAt: string;
}

export interface UpdateCatalyticPurchaseRequest {
  supplierId: number;
  catalyticConverterId: number;
  quantity: number;
  purchasePrice: number;
  warehouseId: number;
  operatorUserId: number;
  purchasedAt: string;
}

export interface CatalyticConverterListItemDto {
  id: number;
  code: string;
  description: string | null;
  sellingPrice: number | null;
  totalAvailableQuantity: number;
  totalPurchasedQuantity: number;
  batchesCount: number;
  minPurchasePrice: number | null;
  maxPurchasePrice: number | null;
}

export interface PagedResult<T> {
  totalItems: number;
  page: number;
  pageSize: number;
  results: T[];
}

export type GetCatalyticConvertersResponse =
  PagedResult<CatalyticConverterListItemDto>;

export interface GetCatalyticConvertersParams {
  brandId?: number;
  modelId?: number;
  engineId?: number;
  fuelTypeId?: number;
  year?: number;
  powerHp?: number;
  page?: number;
  pageSize?: number;
}

export interface CatalyticStockBatchDto {
  id: number;
  catalyticConverterId: number;
  warehouseId: number;
  warehouseName?: string | null;
  quantity: number;
  remainingQuantity: number;
  purchasePrice: number;
  supplierId: number;
  supplierName?: string | null;
  createdAt: string;
}

export interface CatalyticConverterDetailsDto {
  id: number;
  code: string;
  description: string | null;
  sellingPrice: number | null;
  compatibilities?: CatalyticConverterCompatibilityDetails[];
  totalAvailableQuantity: number;
  batches: CatalyticStockBatchDto[];
}

export interface CatalyticPurchaseDto {
  id: number;
  catalyticConverterId: number;
  supplierId: number;
  quantity: number;
  purchasePrice: number;
  totalAmount: number;
  warehouseId: number;
  operatorUserId: number;
  purchasedAt: string;
}
