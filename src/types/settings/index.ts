// Languages
export interface Language {
  id: number;
  code: string;
  name: string;
  isDefault: boolean;
  isEnabled: boolean;
  flag?: string;
}

//Shop & Warehouse
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

type DataKey = "brands" | "categories" | "unitTypes" | "boxSizes";
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

export type ProductSettingsTab = {
  id: TabId;
  label: string;
  type: string;
  service: {
    create: (code: string) => Promise<any>;
    getAll: () => Promise<any>;
    delete: (id: number) => Promise<any>;
    update: (id: number, code: string) => Promise<any>;
  };
};
