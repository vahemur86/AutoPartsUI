import type { ProductSettingsTab, TabConfig, TabId } from "@/types/settings";
import {
  boxSizeService,
  brandsService,
  categoryService,
  unitTypeService,
} from "@/services/settings/productSettings";
import {
  addBoxSize,
  addBrand,
  addCategory,
  addUnitType,
  fetchBoxSizes,
  fetchBrands,
  fetchCategories,
  fetchUnitTypes,
  removeBoxSize,
  removeBrand,
  removeCategory,
  removeUnitType,
  updateBoxSizeInStore,
  updateBrandInStore,
  updateCategoryInStore,
  updateUnitTypeInStore,
} from "@/store/slices/productSettingsSlice";

export const PRODUCT_SETTINGS_TABS: ProductSettingsTab[] = [
  {
    id: "category",
    label: "Category Code",
    type: "Category",
    service: categoryService,
  },
  {
    id: "brand",
    label: "Brand Code",
    type: "Brand",
    service: brandsService,
  },
  {
    id: "unitType",
    label: "Unit Types Code",
    type: "Unit Type",
    service: unitTypeService,
  },
  {
    id: "boxSize",
    label: "Box Size Code",
    type: "Box Size",
    service: boxSizeService,
  },
];

export const TAB_CONFIG: Record<TabId, TabConfig> = {
  brand: {
    dataKey: "brands",
    actions: {
      fetch: fetchBrands,
      add: addBrand,
      update: updateBrandInStore,
      remove: removeBrand,
    },
  },
  category: {
    dataKey: "categories",
    actions: {
      fetch: fetchCategories,
      add: addCategory,
      update: updateCategoryInStore,
      remove: removeCategory,
    },
  },
  unitType: {
    dataKey: "unitTypes",
    actions: {
      fetch: fetchUnitTypes,
      add: addUnitType,
      update: updateUnitTypeInStore,
      remove: removeUnitType,
    },
  },
  boxSize: {
    dataKey: "boxSizes",
    actions: {
      fetch: fetchBoxSizes,
      add: addBoxSize,
      update: updateBoxSizeInStore,
      remove: removeBoxSize,
    },
  },
};

export const CURRENCIES = [
  { value: "AMD", label: "AMD" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "RUB", label: "RUB" },
];
