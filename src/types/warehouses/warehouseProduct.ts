export interface AddProductToWarehouseRequest {
  warehouseId: number;
  productId: number;
  originalPrice: number;
  salePrice: number;
  quantity: number;
  cashRegisterId: number;
}

export interface TransferProductRequest {
  warehouseId: number;
  shopId: number;
  productId: number;
  quantity: number;
  cashRegisterId: number;
}

export interface AddProductToWarehouseResponse {
  id?: number;
  warehouseId: number;
  productId: number;
  originalPrice: number;
  salePrice: number;
  quantity: number;
}

export interface TransferProductResponse {
  success: boolean;
  message?: string;
}

export interface WarehouseProductItem {
  id: number;
  warehouseId: number;
  productId: number;
  originalPrice: number;
  salePrice: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetWarehouseProductsParams {
  warehouseId: number;
  cashRegisterId: number;
}

export type GetWarehouseProductsResponse = WarehouseProductItem[];

export interface ShopProductItem {
  id: number;
  shopId: number;
  productId: number;
  quantity: number;
  salePrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetShopProductsParams {
  shopId: number;
  cashRegisterId: number;
}

export type GetShopProductsResponse = ShopProductItem[];