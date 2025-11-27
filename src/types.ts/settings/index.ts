export interface Language {
  id: number;
  code: string;
  name: string;
  isDefault: boolean;
  isEnabled: boolean;
  flag?: string;
}

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
