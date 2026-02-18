/* eslint-disable @typescript-eslint/no-explicit-any */
// Languages
export interface Language {
  id: number;
  code: string;
  name: string;
  isDefault: boolean;
  isEnabled: boolean;
  flag?: string;
}

// Shop & Warehouse
export interface ExistingShop {
  id: string;
  name: string;
  enabled: boolean;
}

export interface Warehouse {
  id: number;
  code: string;
}

export interface Shop {
  id: number;
  code: string;
  warehouseId: number;
}

export interface Task {
  id: number;
  code: string;
  laborCost: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehiclePayload {
  brandId: number;
  modelId: number;
  fuelTypeId: number;
  engineId: number;
  marketId: number;
  horsePower: number;
  driveTypeId: number;
}

export interface VehicleFilter {
  brandId?: number;
  modelId?: number;
  fuelTypeId?: number;
  engineId?: number;
  marketId?: number;
  driveTypeId?: number;
  year?: number;
  hpMin?: number;
  hpMax?: number;
  page?: number;
  pageSize?: number;
}

export interface MetalRate {
  id: number;
  currencyCode: string;
  ptPricePerGram: number;
  pdPricePerGram: number;
  rhPricePerGram: number;
  effectiveFrom: string;
  isActive: boolean;
}

export interface ExistingItem {
  id: string;
  name: string;
}

// Product Settings
export interface ProductSettingItem {
  id: number;
  code: string;
  enabled?: boolean;
}

// Exchange Rates
export interface ExchangeRate {
  id: number;
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: number;
  effectiveFrom: string;
  isActive: boolean;
  createdAt: string;
  createdByUserId: number;
}

export interface CreateExchangeRate {
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: number;
  effectiveFrom: string;
  isActive: boolean;
}

export type DataKey = "brands" | "categories" | "unitTypes" | "boxSizes";
export type TabId = "brand" | "category" | "unitType" | "boxSize";

type TabActions = {
  fetch: () => any;
  add: (code: string) => any;
  update: (payload: { id: number; code: string }) => any;
  remove: (id: number) => any;
};

export type TabConfig = {
  dataKey: DataKey;
  actions: TabActions;
};

export type CrudService<TItem> = {
  create: (code: string) => Promise<TItem>;
  getAll: () => Promise<TItem[]>;
  delete: (id: number) => Promise<unknown>;
  update: (id: number, code: string) => Promise<TItem>;
};

export type ProductSettingsTab = {
  id: TabId;
  label: string;
  type: string;
  service: CrudService<ProductSettingItem>;
};

export type Vehicle = {
  id: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
  fuelType: string;
  market: string;
  horsePower: number;
  driveType: string;
};

export interface VehicleDefinition {
  lang: string;
  brands: Array<{ id: number; code: string; name: string }>;
  models: Array<{ id: number; code: string; name: string }>;
  fuelTypes: Array<{ id: number; code: string; name: string }>;
  engines: Array<{ id: number; code: string; name: string }>;
  markets?: Array<{ id: number; code: string; name: string }>;
  driveTypes?: Array<{ id: number; code: string; name: string }>;
}

export interface CatalystBucket {
  id: number;
  code: string;
  weight: number;
  ptWeight: number;
  pdWeight: number;
  rhWeight: number;
  isActive: boolean;
}

export interface CatalystBucketByGroupItem {
  id: number;
  code: string;
  name: string | null;
  weight: number;
  ptWeight: number;
  pdWeight: number;
  rhWeight: number;
  prices: Record<string, number>;
}

export interface CatalystBucketByGroup {
  requestedCode: string;
  groupCode: string;
  currencyCode: string;
  items: CatalystBucketByGroupItem[];
  totals: Record<string, number>;
}

export interface CustomerType {
  id: number;
  code: string;
  isDefault: boolean;
  bonusPercent: number;
  isActive: boolean;
}

export interface OfferIncreaseOption {
  id: number;
  shopId: number;
  order: number;
  percent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Sale Percentages
export interface SalePercentage {
  id: number;
  percentage: number;
  isActive: boolean;
}