export interface Product {
  id: number;
  code: string;
  sku: string;
  brandId: number;
  brandName?: string;
  categoryId: number;
  categoryName?: string;
  unitTypeId: number;
  unitTypeName?: string;
  boxSizeId: number;
  boxSizeName?: string;
  vehicleDependent: boolean;
  brand?: { id: number; code: string };
  category?: { id: number; code: string };
  unitType?: { id: number; code: string };
  boxSize?: { id: number; code: string };
}
