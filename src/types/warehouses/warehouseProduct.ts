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
