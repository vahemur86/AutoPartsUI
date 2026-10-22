import api from "./index";
import { getApiErrorMessage, mapI18nCodeToApiCode } from "@/utils";
import type {
  ModelBulkResult,
  VehicleAdminLookups,
  VehicleBulkPayload,
  VehicleBulkResult,
  VehicleDefinitionFilters,
  VehicleDefinitionPayload,
  VehicleDefinitionRecord,
  VehicleDictionaryItem,
  VehicleDictionaryKey,
} from "@/types/vehicleAdmin";

const dictionaryPaths: Record<VehicleDictionaryKey, string> = {
  brands: "/vehicle-dictionaries/brands",
  models: "/vehicle-dictionaries/models",
  engines: "/vehicle-dictionaries/engines",
  "fuel-types": "/vehicle-dictionaries/fuel-types",
  "drive-types": "/vehicle-dictionaries/drive-types",
  "vehicle-markets": "/vehicle-dictionaries/vehicle-markets",
  "trim-names": "/vehicle-dictionaries/trims",
};

const request = async <T>(operation: () => Promise<{ data: T }>, fallback: string) => {
  try {
    return (await operation()).data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, fallback));
  }
};

export const getVehicleAdminLookups = (lang: string) =>
  request(
    () =>
      api.get<VehicleAdminLookups>("/lookups/vehicle-definitions", {
        params: { lang: mapI18nCodeToApiCode(lang) },
      }),
    "Failed to load vehicle dictionaries.",
  );

export const getDictionaryItems = (
  key: VehicleDictionaryKey,
  brandId?: number,
) =>
  request(
    () =>
      api.get<VehicleDictionaryItem[]>(dictionaryPaths[key], {
        params: key === "models" && brandId ? { brandId } : undefined,
      }),
    `Failed to load ${key}.`,
  );

export const getVehicleModelsForBrand = (brandId: number, lang: string) =>
  request(
    () =>
      api.get<Array<VehicleDictionaryItem & { name: string }>>(
        "/lookups/models",
        {
          params: {
            brandId,
            lang: mapI18nCodeToApiCode(lang),
          },
        },
      ),
    "Failed to load models for the selected brand.",
  );

export const createDictionaryItem = (
  key: VehicleDictionaryKey,
  payload: { code: string; brandId?: number },
) =>
  request(
    () => api.post<VehicleDictionaryItem>(dictionaryPaths[key], payload),
    `Failed to create ${key} item.`,
  );

export const updateDictionaryItem = (
  key: VehicleDictionaryKey,
  id: number,
  payload: { code: string; brandId?: number },
) =>
  request(
    () =>
      api.put<VehicleDictionaryItem>(`${dictionaryPaths[key]}/${id}`, payload),
    `Failed to update ${key} item.`,
  );

export const deleteDictionaryItem = (
  key: VehicleDictionaryKey,
  id: number,
) =>
  request(
    () => api.delete<void>(`${dictionaryPaths[key]}/${id}`),
    `Failed to delete ${key} item.`,
  );

export const createModelsBulk = (brandId: number, codes: string[]) =>
  request(
    () =>
      api.post<ModelBulkResult>("/models/bulk", {
        brandId,
        codes,
      }),
    "Failed to create models.",
  );

export const getVehicleDefinitionsPage = (filters: VehicleDefinitionFilters) =>
  request(
    () =>
      api.get<
        | VehicleDefinitionRecord[]
        | {
            results?: VehicleDefinitionRecord[];
            items?: VehicleDefinitionRecord[];
            totalItems?: number;
            totalCount?: number;
            page?: number;
            pageSize?: number;
          }
      >("/vehicle-definitions", { params: filters }),
    "Failed to load vehicle definitions.",
  );

export const getAllVehicleDefinitions = async (
  filters: Omit<VehicleDefinitionFilters, "page" | "pageSize">,
) => {
  const pageSize = 100;
  const firstPage = normalizeVehiclePage(
    await getVehicleDefinitionsPage({ ...filters, page: 1, pageSize }),
  );
  const results = [...firstPage.results];
  const totalItems = firstPage.totalItems;
  const totalPages = Math.ceil(totalItems / pageSize);

  for (let page = 2; page <= totalPages; page += 1) {
    const nextPage = normalizeVehiclePage(
      await getVehicleDefinitionsPage({ ...filters, page, pageSize }),
    );
    if (!nextPage.results.length) break;
    results.push(...nextPage.results);
  }

  return results;
};

export const createVehicleDefinition = (payload: VehicleDefinitionPayload) =>
  request(
    () => api.post<VehicleDefinitionRecord>("/vehicle-definitions", payload),
    "Failed to create vehicle definition.",
  );

export const createVehicleDefinitionsBulk = (payload: VehicleBulkPayload) =>
  request(
    () =>
      api.post<VehicleBulkResult>("/vehicle-definitions/bulk", payload),
    "Failed to create vehicle definitions.",
  );

export const normalizeVehiclePage = (
  response: Awaited<ReturnType<typeof getVehicleDefinitionsPage>>,
) => {
  if (Array.isArray(response)) {
    return {
      results: response,
      totalItems: response.length,
      pageSize: response.length,
    };
  }
  if (response && typeof response === "object") {
    const results = response.results ?? response.items;
    if (Array.isArray(results)) {
      return {
        results,
        totalItems: response.totalItems ?? response.totalCount ?? results.length,
        pageSize: response.pageSize ?? results.length,
      };
    }
  }
  throw new Error("Vehicle definitions response has an unsupported format.");
};
