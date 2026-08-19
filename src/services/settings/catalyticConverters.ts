import api from "..";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  CreateCatalyticConverterRequest,
  UpdateCatalyticConverterRequest,
  CreateCatalyticPurchaseRequest,
  UpdateCatalyticPurchaseRequest,
  GetCatalyticConvertersParams,
  GetCatalyticConvertersResponse,
  CatalyticConverterDetailsDto,
  CatalyticConverterSupplier,
  CatalyticConverterSupplierLookup,
  CreateCatalyticConverterSupplierRequest,
  UpdateCatalyticConverterSupplierRequest,
  CatalyticPurchaseDto,
} from "@/types/catalyticConverters";

const BASE_URL = "/admin/catalog/catalytic-converters";

export const createCatalyticConverter = async (
  payload: CreateCatalyticConverterRequest,
): Promise<number> => {
  try {
    const response = await api.post<number>(BASE_URL, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create catalytic converter."),
    );
  }
};

export const updateCatalyticConverter = async (
  id: number,
  payload: UpdateCatalyticConverterRequest,
): Promise<void> => {
  try {
    await api.put(`${BASE_URL}/${id}`, payload);
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update catalytic converter."),
    );
  }
};

export const createCatalyticPurchase = async (
  payload: CreateCatalyticPurchaseRequest,
): Promise<number> => {
  try {
    const response = await api.post<number>(
      `${BASE_URL}/purchase`,
      payload,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create purchase."),
    );
  }
};

export const getCatalyticPurchaseById = async (
  purchaseId: number,
): Promise<CatalyticPurchaseDto> => {
  try {
    const response = await api.get<CatalyticPurchaseDto>(
      `${BASE_URL}/purchase/${purchaseId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get catalytic purchase."),
    );
  }
};

export const updateCatalyticPurchase = async (
  purchaseId: number,
  payload: UpdateCatalyticPurchaseRequest,
): Promise<void> => {
  try {
    await api.put(`${BASE_URL}/purchase/${purchaseId}`, payload);
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update purchase."),
    );
  }
};

export const getCatalyticConverters = async (
  params: GetCatalyticConvertersParams = {},
): Promise<GetCatalyticConvertersResponse> => {
  try {
    const response = await api.get<GetCatalyticConvertersResponse>(BASE_URL, {
      params,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get catalytic converters."),
    );
  }
};

export const searchCatalyticConverterSuppliers = async (
  search?: string,
): Promise<CatalyticConverterSupplierLookup[]> => {
  try {
    const response = await api.get<CatalyticConverterSupplierLookup[]>(
      `${BASE_URL}/suppliers`,
      {
        params: {
          search,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to search suppliers."),
    );
  }
};

export const createCatalyticConverterSupplier = async (
  payload: CreateCatalyticConverterSupplierRequest,
): Promise<CatalyticConverterSupplier> => {
  try {
    const response = await api.post<CatalyticConverterSupplier>(
      `${BASE_URL}/suppliers`,
      payload,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create supplier."),
    );
  }
};

export const updateCatalyticConverterSupplier = async (
  supplierId: number,
  payload: UpdateCatalyticConverterSupplierRequest,
): Promise<CatalyticConverterSupplier> => {
  try {
    const response = await api.put<CatalyticConverterSupplier>(
      `${BASE_URL}/suppliers/${supplierId}`,
      payload,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update supplier."),
    );
  }
};

export const deleteCatalyticConverterSupplier = async (
  supplierId: number,
): Promise<void> => {
  try {
    await api.delete(`${BASE_URL}/suppliers/${supplierId}`);
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to delete supplier."),
    );
  }
};

export const getCatalyticConverterById = async (
  id: number,
): Promise<CatalyticConverterDetailsDto> => {
  try {
    const response = await api.get<CatalyticConverterDetailsDto>(
      `${BASE_URL}/${id}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get catalytic converter."),
    );
  }
};
