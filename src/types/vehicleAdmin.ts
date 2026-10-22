export interface VehicleDictionaryItem {
  id: number;
  code: string;
  brandId?: number;
}

export interface VehicleAdminLookups {
  brands: Array<VehicleDictionaryItem & { name: string }>;
  models: Array<VehicleDictionaryItem & { name: string }>;
  trimNames: Array<VehicleDictionaryItem & { name: string }>;
  fuelTypes: Array<VehicleDictionaryItem & { name: string }>;
  engines: Array<VehicleDictionaryItem & { name: string }>;
  driveTypes: Array<VehicleDictionaryItem & { name: string }>;
  markets: Array<VehicleDictionaryItem & { name: string }>;
}

export type VehicleDictionaryKey =
  | "brands"
  | "models"
  | "engines"
  | "fuel-types"
  | "drive-types"
  | "vehicle-markets"
  | "trim-names";

export interface VehicleDefinitionRecord {
  id: number;
  brandId: number;
  modelId: number;
  trimNameId: number;
  fuelTypeId: number;
  engineId: number;
  marketId: number;
  driveTypeId: number;
  horsePower: number;
  year: number;
  brand?: VehicleDictionaryItem & { name?: string };
  model?: VehicleDictionaryItem & { name?: string };
  trimName?: VehicleDictionaryItem & { name?: string };
  fuelType?: VehicleDictionaryItem & { name?: string };
  engine?: VehicleDictionaryItem & { name?: string };
  market?: VehicleDictionaryItem & { name?: string };
  driveType?: VehicleDictionaryItem & { name?: string };
  brandName?: string;
  modelName?: string;
  trimNameCode?: string;
  fuelTypeName?: string;
  engineName?: string;
  marketName?: string;
  driveTypeName?: string;
}

export interface VehicleDefinitionFilters {
  brandId?: number;
  modelId?: number;
  trimNameId?: number;
  fuelTypeId?: number;
  engineId?: number;
  driveTypeId?: number;
  marketId?: number;
  year?: number;
  hpMin?: number;
  hpMax?: number;
  page?: number;
  pageSize?: number;
}

export interface VehicleDefinitionPayload {
  brandId: number;
  modelId: number;
  trimNameId: number;
  fuelTypeId: number;
  engineId: number;
  marketId: number;
  driveTypeId: number;
  horsePower: number;
  year: number;
}

export interface VehicleBulkPayload {
  brandId: number;
  modelId: number;
  trimNameIds: number[];
  fuelTypeIds: number[];
  engineIds: number[];
  marketIds: number[];
  driveTypeIds: number[];
  horsePower: number;
  year: number;
}

export interface VehicleBulkResultItem extends VehicleDefinitionPayload {
  status: "created" | "skipped" | "error" | string;
  reason?: string;
}

export interface VehicleBulkResult {
  requested: number;
  created: number;
  skipped: number;
  items: VehicleBulkResultItem[];
}

export interface ModelBulkResult {
  created: VehicleDictionaryItem[];
  skipped: Array<{ code: string; reason: string }>;
}
