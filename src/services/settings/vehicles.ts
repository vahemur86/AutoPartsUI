import api from "..";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { CreateVehiclePayload, VehicleDefinition } from "@/types/settings";

export const getVehicleDefinitions = async (brandId?: number) => {
  try {
    const params = brandId ? `?brandId=${brandId}` : "";
    const response = await api.get(`/lookups/vehicle-definitions${params}`);
    return response.data as VehicleDefinition;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get vehicle definitions."),
    );
  }
};

export const createVehicle = async (payload: CreateVehiclePayload) => {
  try {
    const response = await api.post(`/vehicle-definitions`, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create vehicle."));
  }
};

export const getVehicles = async (withBuckets?: boolean) => {
  try {
    const BASE_URL = "/vehicle-definitions";
    const FINAL_URL = withBuckets
      ? `${BASE_URL}/search-with-buckets`
      : BASE_URL;

    const response = await api.get(FINAL_URL);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get vehicles."));
  }
};

export const getVehicleBuckets = async (vehicleId: string) => {
  try {
    const response = await api.get(
      `/superadmin/vehicle-definitions/${vehicleId}/buckets`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get vehicle buckets."),
    );
  }
};

export const updateVehicleBuckets = async ({
  vehicleId,
  bucketIds = [],
}: {
  vehicleId: string;
  bucketIds: number[];
}) => {
  try {
    const response = await api.put(
      `/superadmin/vehicle-definitions/${vehicleId}/buckets`,
      {
        bucketIds,
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update vehicle buckets."),
    );
  }
};
