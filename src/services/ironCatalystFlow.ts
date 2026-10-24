import api from "@/services";
import { getApiErrorMessage, getHeaders } from "@/utils";
import type {
  AvailableIronPurchase,
  IronProcessingBatch,
  IronPowderProfitReport,
  IronWarehouseTransfer,
  ProcessIronToPowderRequest,
  BulkProcessIronToPowderRequest,
  BulkProcessIronToPowderResponse,
  IronPowderStockLot,
  IronPowderSaleRequest,
  IronPowderSaleResponse,
  PhysicalIronSaleRequest,
  PhysicalIronSaleResponse,
  BulkPhysicalIronSaleRequest,
  BulkPhysicalIronSaleResponse,
  PhysicalIronSaleReportItem,
  AvailableIronPurchasesSummary,
  IronWarehouseStock,
} from "@/types/ironCatalystFlow";

const IRON_SHOP = "/admin/iron-shop";

const asArray = <T>(data: T[] | { results?: T[] } | null | undefined): T[] =>
  Array.isArray(data) ? data : data?.results ?? [];

export const getAvailableIronPurchases = async (
  cashRegisterId: number,
  params: { ironTypeId?: number; categoryId?: number; lang?: string } = {},
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
  params: { ironTypeId?: number; categoryId?: number; lang?: string } = {},
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

export const getIronWarehouseTransfers = async (
  params: { warehouseId?: number; lang?: string },
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

export const getIronWarehouseStock = async (
  warehouseId: number,
  lang: string,
  cashRegisterId: number,
): Promise<IronWarehouseStock[]> => {
  try {
    const response = await api.get<IronWarehouseStock[] | { results?: IronWarehouseStock[] }>(
      `${IRON_SHOP}/warehouses/${warehouseId}/iron-stock`,
      { params: { lang }, headers: getHeaders(cashRegisterId) },
    );
    return asArray(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load warehouse iron stock."));
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

export const processBulkIronToPowder = async (
  payload: BulkProcessIronToPowderRequest,
  cashRegisterId: number,
): Promise<BulkProcessIronToPowderResponse> => {
  try {
    const response = await api.post<BulkProcessIronToPowderResponse>(
      `${IRON_SHOP}/processing/to-powder/bulk`,
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
      { params: { warehouseId }, headers: getHeaders(cashRegisterId) },
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

export const createBulkPhysicalIronSale = async (
  payload: BulkPhysicalIronSaleRequest,
  cashRegisterId: number,
): Promise<BulkPhysicalIronSaleResponse> => {
  try {
    const response = await api.post<BulkPhysicalIronSaleResponse>(
      `${IRON_SHOP}/physical-sales/bulk`,
      payload,
      { headers: getHeaders(cashRegisterId) },
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to sell physical iron."));
  }
};

export const getPhysicalIronSalesReport = async (
  params: { warehouseId?: number; fromUtc?: string; toUtc?: string },
  cashRegisterId: number,
): Promise<PhysicalIronSaleReportItem[]> => {
  try {
    const response = await api.get<PhysicalIronSaleReportItem[] | { results?: PhysicalIronSaleReportItem[] }>(
      `${IRON_SHOP}/physical-sales/report`,
      { params, headers: getHeaders(cashRegisterId) },
    );
    return asArray(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to load physical iron sales report."));
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