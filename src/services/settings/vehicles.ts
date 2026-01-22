import type { VehicleDefinition } from "@/types/settings";
import api from "..";

import { getApiErrorMessage } from "@/utils";

export const getVehicleDefinitions = async (brandId?: number) => {
  try {
    const params = brandId ? `?brandId=${brandId}` : "";
    const response = await api.get(`/lookups/vehicle-definitions${params}`);
    return response.data as VehicleDefinition;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get vehicle definitions.")
    );
  }
};

export interface CreateVehiclePayload {
  brandId: number;
  modelId: number;
  fuelTypeId: number;
  engineId: number;
  marketId: number;
  horsePower: number;
  driveTypeId: number;
}

export const createVehicle = async (payload: CreateVehiclePayload) => {
  try {
    const response = await api.post(`/vehicle-definitions`, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create vehicle."));
  }
};

export const getVehicles = async () => {
  try {
    const response = await api.get(`/vehicle-definitions`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get vehicles."));
  }
};
