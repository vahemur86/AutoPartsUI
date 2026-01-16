export interface Product {
  id: number;
  code: string;
  sku: string;
  brandId: number;
  categoryId: number;
  unitTypeId: number;
  boxSizeId: number;
  vehicleDependent: boolean;
  brand?: { id: number; code: string };
  category?: { id: number; code: string };
  unitType?: { id: number; code: string };
  boxSize?: { id: number; code: string };
}
