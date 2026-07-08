import api from "..";

import { getApiErrorMessage } from "@/utils";
import type {
  AddProgrammingPricingPayload,
  ProgrammingPricingEntry,
  ProgrammingServiceItem,
  UpdateProgrammingAdminSellingPricePayload,
  UpdateProgrammingMyCostPayload,
  VehicleBestProgrammerPricingResponse,
  VehicleDefinitionLookups,
  VehicleDefinitionSearchParams,
  VehicleDefinitionSearchResponse,
} from "@/types/settings";

const toApiLang = (lang: string) => {
  if (lang === "am") {
    return "arm";
  }
  return lang;
};

const normalizeProgrammingEntry = (item: any): ProgrammingPricingEntry => {
  const brandName = item?.brandName ?? "";
  const modelName = item?.modelName ?? "";
  const year = item?.year ?? "";
  const location = item?.location ?? "";

  return {
    id: Number(item?.id ?? 0),
    vehicleDefinitionId: Number(item?.vehicleDefinitionId ?? 0),
    vehicleName:
      item?.vehicleName ?? (`${brandName} ${modelName} ${year}`.trim() || "-"),
    serviceId: Number(item?.serviceId ?? 0),
    serviceName: item?.serviceName ?? "-",
    programmerUserId: Number(item?.programmerUserId ?? 0),
    programmerUsername: item?.programmerUsername ?? "-",
    serviceCost: Number(item?.serviceCost ?? 0),
    sellingPrice: Number(item?.sellingPrice ?? 0),
    profit: Number(item?.profit ?? 0),
    isActive: Boolean(item?.isActive ?? true),
    createdAt: item?.createdAt ?? "",
    updatedAt: item?.updatedAt ?? null,
    location,
  };
};

export const getVehicleDefinitionLookups = async (
  lang: string = "arm",
  brandId?: number,
): Promise<VehicleDefinitionLookups> => {
  try {
    const response = await api.get("/lookups/vehicle-definitions", {
      params: {
        lang: toApiLang(lang),
        ...(brandId ? { brandId } : {}),
      },
    });

    return {
      brands: Array.isArray(response.data?.brands) ? response.data.brands : [],
      models: Array.isArray(response.data?.models) ? response.data.models : [],
      fuelTypes: Array.isArray(response.data?.fuelTypes)
        ? response.data.fuelTypes
        : [],
      engines: Array.isArray(response.data?.engines) ? response.data.engines : [],
      markets: Array.isArray(response.data?.markets) ? response.data.markets : [],
      driveTypes: Array.isArray(response.data?.driveTypes)
        ? response.data.driveTypes
        : [],
    };
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to load vehicle lookups."));
  }
};

export const searchVehicleDefinitions = async (
  params: VehicleDefinitionSearchParams,
): Promise<VehicleDefinitionSearchResponse> => {
  try {
    const response = await api.get("/vehicle-definitions/search", {
      params: {
        ...params,
        lang: toApiLang(params.lang ?? "arm"),
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      },
    });

    return {
      totalItems: Number(response.data?.totalItems ?? 0),
      page: Number(response.data?.page ?? 1),
      pageSize: Number(response.data?.pageSize ?? 20),
      results: Array.isArray(response.data?.results) ? response.data.results : [],
    };
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to search vehicles."));
  }
};

export const getProgrammingServices = async (): Promise<ProgrammingServiceItem[]> => {
  try {
    const response = await api.get("/Service/by-category-code", {
      params: {
        code: "PROGRAMMING",
      },
    });

    return Array.isArray(response.data)
      ? response.data.filter(
          (item: ProgrammingServiceItem) => item.isActive !== false,
        )
      : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to load programming services."),
    );
  }
};

export const addProgrammingPricing = async (
  payload: AddProgrammingPricingPayload,
): Promise<ProgrammingPricingEntry[]> => {
  try {
    const response = await api.post("/ProgrammerServicePricing", payload);
    return Array.isArray(response.data)
      ? response.data.map(normalizeProgrammingEntry)
      : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create programming pricing entry."),
    );
  }
};

export const updateMyProgrammingCost = async (
  payload: UpdateProgrammingMyCostPayload,
): Promise<ProgrammingPricingEntry> => {
  try {
    const response = await api.put("/ProgrammerServicePricing/my-cost", payload);
    return normalizeProgrammingEntry(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update service cost."));
  }
};

export const getMyProgrammingPricing = async (): Promise<
  ProgrammingPricingEntry[]
> => {
  try {
    const response = await api.get("/ProgrammerServicePricing/mine");
    return Array.isArray(response.data)
      ? response.data.map(normalizeProgrammingEntry)
      : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to load your programming entries."),
    );
  }
};

export const getAllProgrammingPricingForAdmin = async (): Promise<
  ProgrammingPricingEntry[]
> => {
  try {
    const response = await api.get("/ProgrammerServicePricing/admin/all");
    return Array.isArray(response.data)
      ? response.data.map(normalizeProgrammingEntry)
      : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to load programming entries."),
    );
  }
};

export const searchProgrammingPricingForAdmin = async (params?: {
  programmerUsername?: string;
  brandId?: number;
  modelId?: number;
}): Promise<ProgrammingPricingEntry[]> => {
  try {
    const response = await api.get("/ProgrammerServicePricing/admin/search", {
      params: {
        ...(params?.programmerUsername
          ? { programmerUsername: params.programmerUsername }
          : {}),
        ...(params?.brandId ? { brandId: params.brandId } : {}),
        ...(params?.modelId ? { modelId: params.modelId } : {}),
      },
    });

    return Array.isArray(response.data)
      ? response.data.map(normalizeProgrammingEntry)
      : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to search programming entries."),
    );
  }
};

export const getProgrammingPricingByVehicleForAdmin = async (
  vehicleDefinitionId: number,
): Promise<ProgrammingPricingEntry[]> => {
  try {
    const response = await api.get(
      `/vehicleservicepricing/programming/admin/vehicle/${vehicleDefinitionId}`,
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Failed to load programming entries for selected vehicle.",
      ),
    );
  }
};

export const updateProgrammingSellingPriceAsAdmin = async (
  payload: UpdateProgrammingAdminSellingPricePayload,
): Promise<ProgrammingPricingEntry> => {
  try {
    const response = await api.put(
      "/ProgrammerServicePricing/admin/selling-price",
      payload,
    );
    return normalizeProgrammingEntry(response.data);
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update selling price."),
    );
  }
};

export const getVehiclePricingWithBestProgrammer = async (
  vehicleDefinitionId: number,
): Promise<VehicleBestProgrammerPricingResponse> => {
  try {
    const response = await api.get(
      `/vehicleservicepricing/vehicle/${vehicleDefinitionId}`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to load vehicle pricing."));
  }
};
