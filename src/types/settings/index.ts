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

export interface ShopPricing {
  id: number;
  shopId: number;
  markupPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Task {
  id: number;
  code: string;
  laborCost: number | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceCategoryItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceCategoryCreatePayload {
  code: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface ServiceCategoryUpdatePayload {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface EmployeeItem {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  serviceCategoryId: number;
  serviceCategoryName?: string;
  hireDate: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeCreatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceCategoryId: number;
  hireDate: string;
  notes?: string;
}

export interface EmployeeUpdatePayload {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceCategoryId: number;
  notes?: string;
}

export interface ServiceCatalogItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  serviceCategoryId: number;
  serviceCategoryName?: string;
  internalCost: number;
  estimatedDurationMinutes: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceCreatePayload {
  code: string;
  name: string;
  description?: string;
  serviceCategoryId: number;
  internalCost: number;
  estimatedDurationMinutes: number;
}

export interface ServiceUpdatePayload {
  id: number;
  name: string;
  description?: string;
  serviceCategoryId: number;
  internalCost: number;
  estimatedDurationMinutes: number;
}

export interface VehicleServiceTemplateLineItem {
  id?: number;
  serviceId: number;
  serviceName?: string;
  internalCost?: number;
  customerPrice: number;
  profit?: number;
  profitMargin?: number;
}

export interface VehicleServiceTemplateItem {
  id: number;
  brandId: number;
  brandName?: string;
  modelId: number;
  modelName?: string;
  year: number;
  fuelTypeId?: number;
  fuelTypeName?: string;
  engineId?: number;
  engineName?: string;
  location: string;
  electricityPrice: number;
  serviceCategoryId: number;
  serviceCategoryName?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  items: VehicleServiceTemplateLineItem[];
}

export interface VehicleServiceTemplateUpsertPayload {
  brandId: number;
  modelId: number;
  year: number;
  fuelTypeId: number;
  engineId: number;
  location: string;
  electricityPrice: number;
  serviceCategoryId: number;
  notes?: string;
  services: Array<{
    serviceId: number;
    customerPrice: number;
  }>;
}

export interface VehicleServiceTemplateCreatePayload
  extends VehicleServiceTemplateUpsertPayload {}

export interface VehicleServiceTemplateUpdatePayload
  extends VehicleServiceTemplateUpsertPayload {
  id: number;
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
  bucketCode?: string;
  cashRegisterId?: number;
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

export interface MetalPrice {
  metalName: string;
  price: number;
}

export interface ExistingItem {
  id: string;
  name: string;
}

// Product Settings
export interface ProductSettingItem {
  id: number;
  code: string;
  name?: string;
  parentCategoryId?: number | null;
  level?: number;
  isActive?: boolean;
  displayOrder?: number;
  canHaveProducts?: boolean;
  enabled?: boolean;
}

export interface CategoryNode {
  id: number;
  code: string;
  name?: string;
  parentCategoryId: number | null;
  parentName?: string | null;
  level: number;
  isActive: boolean;
  displayOrder: number;
  canHaveProducts?: boolean;
  subCategories: CategoryNode[];
}

export interface CategoriesTreeResponse {
  rootCategories: CategoryNode[];
}

export interface CreateCategoryPayload {
  code: string;
  parentCategoryId: number | null;
  displayOrder: number;
}

export interface UpdateCategoryPayload {
  id: number;
  code: string;
  parentCategoryId: number | null;
  isActive: boolean;
  displayOrder: number;
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
  bucketCodes?: string[];
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

export interface VehicleDefinitionByBucket {
  id: number;
  brand: { id: number; code: string; name: string };
  bucketCodes: string[];
  driveType?: { id: number; code: string; name: string };
  engine: { id: number; code: string; name: string };
  fuelType: { id: number; code: string; name: string };
  market?: { id: number; code: string; name: string };
  horsePower: number;
  model: { id: number; code: string; name: string };
  year: number;
  totalItems: number;
}

export interface CatalystBucket {
  id: number;
  code: string;
  weight: number;
  ptWeight: number;
  pdWeight: number;
  rhWeight: number;
  isActive: boolean;
  catalystTypeId: number;
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

export interface CatalystBucketQuoteGroup {
  requestedCode: string;
  groupCode: string;
  currencyCode: string;
  items: Array<{
    id: number;
    code: string;
    name: string | null;
    weight: number;
    ptWeight: number;
    pdWeight: number;
    rhWeight: number;
    catalystTypeId: number;
    price: number;
  }>;
  totalPrice: number;
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

export interface CatalystPricing {
  id: number;
  ptReducePercent: number;
  pdReducePercent: number;
  rhReducePercent: number;
  transportCost1UsdPerKg: number;
  transportCost2UsdPerKg: number;
  commissionPercent: number;
  customerMargins: CustomMargins[];
}

export interface CustomMargins {
  customerTypeId: number;
  customerTypeCode: string;
  profitMarginPercent: number;
}

// Car Catalyst
export interface CarCatalystBucket {
  side: number;
  code: string;
  weightKg: number;
  pt_g: number;
  pd_g: number;
  rh_g: number;
}

export interface CreateCarCatalyst {
  birkaId?: number;
  brandId: number;
  modelId: number;
  year: number;
  country: number;
  engineVolume: number;
  side: number;
  buckets: CarCatalystBucket[];
}

export interface CarCatalyst {
  id: number;
  birkaId?: number;
  birkaName?: string;
  brandId: number;
  modelId: number;
  year: number;
  country: number;
  engineVolume: number;
  side: number;
  buckets: CarCatalystBucket[];
  totalWeightKg?: number;
  averagePt_g?: number;
  averagePd_g?: number;
  averageRh_g?: number;
}
export interface CarCatalystSearchParams {
  code?: string;
  brandId?: number;
  modelId?: number;
  year?: number;
  countryId?: number;
}
