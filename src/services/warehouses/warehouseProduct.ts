// services
import api from "@/services";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  AddProductToWarehouseRequest,
  AddProductToWarehouseResponse,
  TransferProductRequest,
  TransferProductResponse,
  GetWarehouseProductsParams,
  GetWarehouseProductsResponse,
  GetShopProductsParams,
  GetShopProductsResponse,
} from "@/types/warehouses/warehouseProduct";

const performRequest = async <T>(
  requestFn: (headers: { "X-CashRegister-Id": number }) => Promise<{ data: T }>,
  cashRegisterId: number,
  defaultErrorMessage: string,
): Promise<T> => {
  try {
    const response = await requestFn({ "X-CashRegister-Id": cashRegisterId });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, defaultErrorMessage));
  }
};

export const addProductToWarehouse = ({
  cashRegisterId,
  ...body
}: AddProductToWarehouseRequest) =>
  performRequest(
    (headers) =>
      api.post<AddProductToWarehouseResponse>(
        `/WarehouseProduct/add-product`,
        body,
        { headers },
      ),
    cashRegisterId,
    "Failed to add product to warehouse.",
  );

export const transferProduct = ({
  cashRegisterId,
  ...body
}: TransferProductRequest) =>
  performRequest(
    (headers) =>
      api.post<TransferProductResponse>(`/WarehouseProduct/transfer`, body, {
        headers,
      }),
    cashRegisterId,
    "Failed to transfer product.",
  );

export const getWarehouseProducts = ({
  warehouseId,
  cashRegisterId,
}: GetWarehouseProductsParams) =>
  performRequest(
    (headers) =>
      api.get<GetWarehouseProductsResponse>(
        `/WarehouseProduct/${warehouseId}/products`,
        {
          headers,
        },
      ),
    cashRegisterId,
    "Failed to fetch warehouse products.",
  );

export const getShopProducts = ({
  shopId,
  cashRegisterId,
}: GetShopProductsParams) =>
  performRequest(
    (headers) =>
      api.get<GetShopProductsResponse>(
        `/WarehouseProduct/shop/${shopId}/products`,
        {
          headers,
        },
      ),
    cashRegisterId,
    "Failed to fetch shop products.",
  );


