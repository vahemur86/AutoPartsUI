import api from "@/services";
import { getApiErrorMessage, getHeaders } from "@/utils";
import type {
  AvailableIronPurchase,
  IronProcessingBatch,
  IronPowderProfitReport,
  IronWarehouseTransfer,
  ProcessIronToPowderRequest,
  IronPowderStockLot,
  IronPowderSaleRequest,
  IronPowderSaleResponse,
  PhysicalIronSaleRequest,
  PhysicalIronSaleResponse,
  AvailableIronPurchasesSummary,
} from "@/types/ironCatalystFlow";

const IRON_SHOP = "/admin/iron-shop";

const asArray = <T>(data: T[] | { results?: T[] } | null | undefined): T[] =>
  Array.isArray(data) ? data : data?.results ?? [];

export const getAvailableIronPurchases = async (
  cashRegisterId: number,
  params: { ironTypeId?: number; categoryId?: number } = {},
) => {
  try {
    const response = await api.get<AvailableIronPurchase[] | { results?: AvailableIronPurchase[] }>(
      `${IRON_SHOP}/purchases/available-for-transfer`,
      { params, headers: getHeaders(cashRegisterId) },
    );
    return asArray(response.data).filter((purchase) => purchase.remainingWeightKg > 0);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load iron purchases."));
  }
};

export const getAvailableIronPurchasesSummary = async (
  cashRegisterId: number,
  params: { ironTypeId?: number; categoryId?: number } = {},
): Promise<AvailableIronPurchasesSummary> => {
  try {
    const response = await api.get<AvailableIronPurchasesSummary>(
      `${IRON_SHOP}/purchases/available-for-transfer/summary`,
      { params, headers: getHeaders(cashRegisterId) },
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load iron purchase summary."));
  }
};

export const transferIronPurchaseToWarehouse = async (
  purchaseId: number,
  warehouseId: number,
  weightKg: number,
  cashRegisterId: number,
) => {
  try {
    const response = await api.post<IronWarehouseTransfer>(
      `${IRON_SHOP}/purchases/${purchaseId}/transfer-to-warehouse`,
      { warehouseId, weightKg },
      { headers: getHeaders(cashRegisterId) },
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to transfer iron to warehouse."));
  }
};

// The history read route is not included in the supplied API contract.
export const getIronWarehouseTransfers = async (
  params: { warehouseId?: number },
  cashRegisterId: number,
) => {
  try {
    const response = await api.get<IronWarehouseTransfer[] | { results?: IronWarehouseTransfer[] }>(
      `${IRON_SHOP}/purchases/transfers`,
      { params, headers: getHeaders(cashRegisterId) },
    );
    return asArray(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load warehouse transfers."));
  }
};

export const processIronToPowder = async (
  payload: ProcessIronToPowderRequest,
  cashRegisterId: number,
) => {
  try {
    const response = await api.post<IronProcessingBatch>(
      `${IRON_SHOP}/processing/to-powder`,
      payload,
      { headers: getHeaders(cashRegisterId) },
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to process iron into powder."));
  }
};

export const getIronProcessingBatches = async (
  warehouseId: number | undefined,
  cashRegisterId: number,
) => {
  try {
    const response = await api.get<IronProcessingBatch[] | { results?: IronProcessingBatch[] }>(
      `${IRON_SHOP}/processing/batches`,
      { params: { warehouseId }, headers: getHeaders(cashRegisterId) },
    );
    return asArray(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load iron processing batches."));
  }
};

export const getIronPowderStock = async (
  warehouseId: number | undefined,
  cashRegisterId: number,
) => {
  try {
    const response = await api.get<IronPowderStockLot[] | { results?: IronPowderStockLot[] }>(
      `${IRON_SHOP}/powder-stock`,
      { params: { warehouseId, status: 1 }, headers: getHeaders(cashRegisterId) },
    );
    return asArray(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load iron powder stock."));
  }
};

export const getIronPowderProfitReport = async (
  params: { warehouseId?: number; fromUtc?: string; toUtc?: string },
  cashRegisterId: number,
) => {
  try {
    const response = await api.get<IronPowderProfitReport>(
      `${IRON_SHOP}/reports/profit`,
      { params, headers: getHeaders(cashRegisterId) },
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load iron powder profit report."));
  }
};

export const createPhysicalIronSale = async (
  payload: PhysicalIronSaleRequest,
  cashRegisterId: number,
): Promise<PhysicalIronSaleResponse> => {
  try {
    const response = await api.post<PhysicalIronSaleResponse>(
      `${IRON_SHOP}/physical-sales`,
      payload,
      { headers: getHeaders(cashRegisterId) },
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to sell physical iron."));
  }
};

export const createIronPowderSale = async (
  payload: IronPowderSaleRequest,
  cashRegisterId: number,
): Promise<IronPowderSaleResponse> => {
  try {
    const response = await api.post<IronPowderSaleResponse>(
      `${IRON_SHOP}/powder-sales`,
      payload,
      { headers: getHeaders(cashRegisterId) },
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to sell iron-derived powder."));
  }
};