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
};

export interface VehicleDefinition {
  lang: string;
  brands: Array<{ id: number; code: string; name: string }>;
  models: Array<{ id: number; code: string; name: string }>;
  fuelTypes: Array<{ id: number; code: string; name: string }>;
  engines: Array<{ id: number; code: string; name: string }>;
}
