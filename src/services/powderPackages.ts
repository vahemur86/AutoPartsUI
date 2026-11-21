import api from "@/services";
import { getApiErrorMessage } from "@/utils";
import type {
  CreateIronPowderPackageRequest,
  CreatePowderPackageRequest,
  IronPowderPackageSourceBatch,
  PowderPackage,
  PowderPackageSourceBatch,
} from "@/types/powderPackages";

const IRON_SHOP = "/admin/iron-shop";

const request = async <T>(
  action: () => Promise<{ data: T }>,
  fallbackMessage: string,
): Promise<T> => {
  try {
    const response = await action();
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, fallbackMessage));
  }
};

export const powderPackagesService = {
  listSourceBatches: (warehouseId: number) =>
    request(
      () =>
        api.get<PowderPackageSourceBatch[]>("/admin/powder-packages/source-batches", {
          params: { warehouseId },
        }),
      "Failed to load powder batches.",
    ),

  listIronSourceBatches: (warehouseId: number) =>
    request(
      () =>
        api.get<IronPowderPackageSourceBatch[]>(
          `${IRON_SHOP}/powder-packages/source-batches`,
          { params: { warehouseId } },
        ),
      "Failed to load iron powder batches.",
    ),

  list: (warehouseId: number, status?: number) =>
    request(
      () =>
        api.get<PowderPackage[]>("/admin/powder-packages", {
          params: { warehouseId, ...(status ? { status } : {}) },
        }),
      "Failed to load powder packages.",
    ),

  create: (data: CreatePowderPackageRequest) =>
    request(
      () => api.post<PowderPackage[]>("/admin/powder-packages", data),
      "Failed to create powder package.",
    ),

  createIron: (data: CreateIronPowderPackageRequest) =>
    request(
      () => api.post<PowderPackage[]>(`${IRON_SHOP}/powder-packages`, data),
      "Failed to create iron powder package.",
    ),

  sendToWarehouse: (id: number) =>
    request(
      () => api.post<PowderPackage>(`/admin/powder-packages/${id}/send-to-warehouse`),
      "Failed to send powder package to warehouse.",
    ),

  cancel: (id: number) =>
    request(
      () => api.post<PowderPackage>(`/admin/powder-packages/${id}/cancel`),
      "Failed to cancel powder package.",
    ),

  invalidate: (id: number) =>
    request(
      () => api.post<PowderPackage>(`/admin/powder-packages/${id}/invalidate`),
      "Failed to invalidate powder package.",
    ),
};
