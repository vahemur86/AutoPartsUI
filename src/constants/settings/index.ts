import englandFlag from "@/assets/images/england.svg";
import russiaFlag from "@/assets/images/russia.svg";
import armeniaFlag from "@/assets/images/armenia.svg";
import franceFlag from "@/assets/images/france.svg";
import type {
  Language,
  ProductSettingsTab,
  TabConfig,
  TabId,
} from "@/types.ts/settings";
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

export const LANGUAGES: Language[] = [
  {
    id: 1,
    code: "en",
    name: "English",
    flag: englandFlag,
    isDefault: true,
    isEnabled: true,
  },
  {
    id: 2,
    code: "ru",
    name: "Russian",
    flag: russiaFlag,
    isDefault: false,
    isEnabled: true,
  },
  {
    id: 3,
    code: "am",
    name: "Armenian",
    flag: armeniaFlag,
    isDefault: false,
    isEnabled: true,
  },
  {
    id: 4,
    code: "fr",
    name: "France",
    flag: franceFlag,
    isDefault: false,
    isEnabled: true,
  },
];

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
