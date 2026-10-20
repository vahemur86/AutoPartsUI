// api
import api from ".";
import { getIronPurchases } from "./adminProducts";

// utils
import { getApiErrorMessage, getHeaders, mapI18nCodeToApiCode } from "@/utils";

// types
import type {
  CarModel,
  IronType,
  IronTypeByCar,
  IronPricesResponse,
  PurchaseIronApiPayload,
  PurchaseIronResponse,
  IronPrice,
  AddIronPricePayload,
  CarModelPayload,
  GetIronSalesParams,
  GetIronPurchasesReportParams,
  IronPurchasesReportResponse,
  RecalculateStepPayload,
  RecalculatePayload,
  RecalculateResponse,
  UpdateIronTypePricesPayload,
  IronCategory,
  IronCategoryPayload,
  IronCategoryPricePayload,
  UpdateIronCategoryPricesPayload,
  BulkIronPurchaseRequest,
  BulkIronPurchaseResponse,
  OperatorBrandIronType,
} from "@/types/ironCarShop";
import type { IronPurchaseResponse } from "@/types/adminProducts";

const BASE_URL = "/admin/iron-shop";

export const getIronCategories = async (cashRegisterId: number): Promise<IronCategory[]> => {
  try {
    const response = await api.get(`${BASE_URL}/categories`, { headers: getHeaders(cashRegisterId) });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch iron categories."));
  }
};

export const getIronCategory = async (
  categoryId: number,
  cashRegisterId: number,
): Promise<IronCategory> => {
  try {
    const response = await api.get(`${BASE_URL}/categories/${categoryId}`, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch iron category details."));
  }
};

export const createIronCategory = async (
  payload: IronCategoryPayload,
  cashRegisterId: number,
): Promise<IronCategory> => {
  try {
    const response = await api.post(`${BASE_URL}/categories`, payload, { headers: getHeaders(cashRegisterId) });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to create iron category."));
  }
};

export const updateIronCategory = async (
  categoryId: number,
  payload: IronCategoryPayload & { isActive: boolean },
  cashRegisterId: number,
): Promise<IronCategory> => {
  try {
    const response = await api.put(`${BASE_URL}/categories/${categoryId}`, payload, { headers: getHeaders(cashRegisterId) });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update iron category."));
  }
};

export const deleteIronCategory = async (categoryId: number, cashRegisterId: number): Promise<void> => {
  try {
    await api.delete(`${BASE_URL}/categories/${categoryId}`, { headers: getHeaders(cashRegisterId) });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to delete iron category."));
  }
};

export const addIronCategoryPrice = async (
  categoryId: number,
  payload: IronCategoryPricePayload,
  cashRegisterId: number,
): Promise<IronCategoryPricePayload & { id: number }> => {
  try {
    const response = await api.post(`${BASE_URL}/categories/${categoryId}/prices`, payload, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to add category price."));
  }
};

export const updateIronCategoryPrices = async (
  categoryId: number,
  payload: UpdateIronCategoryPricesPayload,
  cashRegisterId: number,
): Promise<void> => {
  try {
    await api.put(`${BASE_URL}/categories/${categoryId}/prices`, payload, {
      headers: getHeaders(cashRegisterId),
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update category prices."));
  }
};

export const deleteIronCategoryPrice = async (
  categoryId: number,
  priceId: number,
  cashRegisterId: number,
): Promise<void> => {
  try {
    await api.delete(`${BASE_URL}/categories/${categoryId}/prices/${priceId}`, {
      headers: getHeaders(cashRegisterId),
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to delete category price."));
  }
};

const formatLang = (lang: string) => mapI18nCodeToApiCode(lang);

export const getCarModels = async (
  cashRegisterId: number,
  lang: string = "en",
): Promise<CarModel[]> => {
  try {
    const response = await api.get(`${BASE_URL}/brands`, {
      params: { lang: formatLang(lang) },
      headers: getHeaders(cashRegisterId),
    });
    const items: Array<{
      id: number;
      name?: string;
      code?: string;
      translations?: Record<string, string>;
    }> = Array.isArray(response.data) ? response.data : [];
    const translationKey = formatLang(lang);
    return items.map((item) => ({
      id: item.id,
      name: item.name || item.translations?.[translationKey] || item.code || "",
    }));
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch car models."));
  }
};

export const getIronTypeCatalog = async (
  cashRegisterId: number,
): Promise<IronType[]> => {
  try {
    const response = await api.get(`${BASE_URL}/iron-types`, {
      headers: getHeaders(cashRegisterId),
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch iron types."));
  }
};

export const getIronTypesByModel = async (
  carModelId: number,
  cashRegisterId: number,
  lang: string = "en",
): Promise<IronType[]> => {
  try {
    const response = await api.get(
      `${BASE_URL}/GetIronTypes/${carModelId}/irontypes`,
      {
        params: { lang: formatLang(lang) },
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch iron types."));
  }
};

export const getIronTypesByCar = async (
  carModelId: number,
  cashRegisterId: number,
  lang: string = "en",
): Promise<IronTypeByCar[]> => {
  try {
    const response = await api.get(`${BASE_URL}/GetIronTypesByCar`, {
      params: { carModelId, lang: formatLang(lang) },
      headers: getHeaders(cashRegisterId),
    });
    return response.data ?? [];
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch iron types by car."),
    );
  }
};

export const getAvailableIronTypes = async (
  params: {
    dictBrandId?: number;
    categoryId?: number;
    customerTypeId: number;
    lang?: string;
  },
  cashRegisterId: number,
): Promise<OperatorBrandIronType[]> => {
  if (Boolean(params.dictBrandId) === Boolean(params.categoryId)) {
    throw new Error("Select exactly one brand or category to load iron prices.");
  }

  try {
    const response = await api.get(`${BASE_URL}/available-types`, {
      params: {
        ...params,
        lang: formatLang(params.lang ?? "en"),
      },
      headers: getHeaders(cashRegisterId),
    });
    const responseData: unknown = response.data;
    const data = Array.isArray(responseData)
      ? responseData
      : responseData &&
          typeof responseData === "object" &&
          "items" in responseData &&
          Array.isArray(responseData.items)
        ? responseData.items
        : [];

    return data.flatMap((rawItem): OperatorBrandIronType[] => {
      if (!rawItem || typeof rawItem !== "object") return [];
      const item = rawItem as {
        ironTypeId?: number;
        id?: number;
        dictBrandId?: number;
        brandId?: number;
        dictBrandName?: string;
        brandName?: string;
        ironTypeCode?: string;
        ironTypeName?: string;
        name?: string;
        code?: string;
        pricePerKg?: number | null;
        isPriceConfigured?: boolean;
        hasRecalculateSteps?: boolean;
        recalculateStepCount?: number;
        categoryId?: number | null;
        categoryName?: string | null;
        prices?: Array<{
          customerTypeId: number;
          pricePerKg: number | null;
        }>;
      };
      const ironTypeId = Number(item.ironTypeId ?? item.id);
      if (!Number.isInteger(ironTypeId) || ironTypeId <= 0) return [];
      const matchingPrice = item.prices?.find(
        (price) => Number(price.customerTypeId) === params.customerTypeId,
      )?.pricePerKg;
      const dictBrandId = Number(item.dictBrandId ?? item.brandId);

      return [{
        ...item,
        ironTypeId,
        ...(Number.isInteger(dictBrandId) && dictBrandId > 0 && { dictBrandId }),
        dictBrandName: item.dictBrandName ?? item.brandName,
        ironTypeCode: item.ironTypeCode ?? item.code,
        ironTypeName: item.ironTypeName ?? item.name,
        pricePerKg:
          item.isPriceConfigured === false
            ? null
            : item.pricePerKg ?? matchingPrice ?? null,
      }];
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch available iron types."));
  }
};

export const getBrandIronTypes = async (
  brandId: number,
  customerTypeId: number,
  cashRegisterId: number,
  lang = "en",
): Promise<OperatorBrandIronType[]> => {
  try {
    const response = await api.get(
      `${BASE_URL}/operator/brand/${brandId}/iron-types`,
      {
        params: { customerTypeId, lang: formatLang(lang) },
        headers: getHeaders(cashRegisterId),
      },
    );
    const responseData: unknown = response.data;
    const data = Array.isArray(responseData)
      ? responseData
      : responseData &&
          typeof responseData === "object" &&
          "items" in responseData &&
          Array.isArray(responseData.items)
        ? responseData.items
        : [];

    return data.flatMap((rawItem): OperatorBrandIronType[] => {
      if (!rawItem || typeof rawItem !== "object") return [];
      const item = rawItem as {
        ironTypeId?: number;
        id?: number;
        ironTypeCode?: string;
        ironTypeName?: string;
        name?: string;
        code?: string;
        pricePerKg?: number | null;
        isPriceConfigured?: boolean;
        hasRecalculateSteps?: boolean;
        recalculateStepCount?: number;
        categoryId?: number | null;
        categoryName?: string | null;
        prices?: Array<{
          customerTypeId: number;
          pricePerKg: number | null;
        }>;
      };
      const ironTypeId = Number(item.ironTypeId ?? item.id);
      if (!Number.isInteger(ironTypeId) || ironTypeId <= 0) return [];
      const matchingPrice = item.prices?.find(
        (price) => Number(price.customerTypeId) === customerTypeId,
      )?.pricePerKg;

      return [{
        ...item,
        ironTypeId,
        ironTypeCode: item.ironTypeCode ?? item.code,
        ironTypeName: item.ironTypeName ?? item.name,
        pricePerKg:
          item.isPriceConfigured === false
            ? null
            : item.pricePerKg ?? matchingPrice ?? null,
      }];
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch effective iron prices."));
  }
};

export const getIronTypesPrices = async (
  params: {
    carModelId: number;
    customerTypeId: number;
    weightsJson: string;
    lang?: string;
  },
  cashRegisterId: number,
): Promise<IronPricesResponse> => {
  try {
    const response = await api.get(`${BASE_URL}/irontypes-prices`, {
      params: {
        ...params,
        ...(params.lang != null && { lang: formatLang(params.lang) }),
      },
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch iron prices."));
  }
};

export const recalculateIron = async (
  payload: RecalculatePayload,
  cashRegisterId: number,
): Promise<RecalculateResponse> => {
  try {
    const response = await api.post(
      `${BASE_URL}/operator/recalculate`,
      payload,
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Recalculation failed."));
  }
};

export const purchaseIron = async (
  payload: PurchaseIronApiPayload,
  cashRegisterId: number,
): Promise<PurchaseIronResponse> => {
  try {
    const response = await api.post(`${BASE_URL}/purchase`, payload, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to submit purchase."));
  }
};

export const purchaseIronBulk = async (
  payload: BulkIronPurchaseRequest,
  cashRegisterId: number,
): Promise<BulkIronPurchaseResponse> => {
  try {
    const response = await api.post(`${BASE_URL}/purchase/bulk`, payload, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to submit bulk iron purchase."));
  }
};

export const getIronSales = async (
  params: GetIronSalesParams,
  cashRegisterId: number,
): Promise<IronPurchaseResponse> => getIronPurchases(params, cashRegisterId);

export const getIronPurchasesReport = async (
  params: GetIronPurchasesReportParams,
  cashRegisterId: number,
): Promise<IronPurchasesReportResponse> => {
  try {
    const response = await api.post(
      `${BASE_URL}/reports/purchases`,
      {
        ...params,
        lang: params.lang ? formatLang(params.lang) : undefined,
      },
      {
        headers: getHeaders(cashRegisterId),
      },
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch iron purchases report."),
    );
  }
};

export const addCarModel = async (
  payload: CarModelPayload,
  cashRegisterId: number,
  lang: string = "en",
): Promise<CarModel> => {
  try {
    const response = await api.post(`${BASE_URL}/iron-types`, payload, {
      params: { lang: formatLang(lang) },
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to add car model."));
  }
};

export const addIronType = async (
  carModelId: number,
  payload: CarModelPayload,
  cashRegisterId: number,
  lang: string = "en",
): Promise<IronType> => {
  try {
    const response = await api.post(
      `${BASE_URL}/AddIronType/${carModelId}/irontypes`,
      payload,
      {
        params: { lang: formatLang(lang) },
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to add iron type."));
  }
};

export const addIronPrice = async (
  ironTypeId: number,
  payload: AddIronPricePayload,
  cashRegisterId: number,
  lang: string = "en",
): Promise<void> => {
  try {
    await api.post(`${BASE_URL}/AddIronPrice/${ironTypeId}/prices`, payload, {
      params: { lang: formatLang(lang) },
      headers: getHeaders(cashRegisterId),
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to add iron price."));
  }
};

export const recalculateStep = async (
  payload: RecalculateStepPayload,
  cashRegisterId: number,
  lang?: string,
): Promise<void> => {
  if (Boolean(payload.dictBrandId) === Boolean(payload.categoryId)) {
    throw new Error("Select exactly one brand or category for recalculation.");
  }

  try {
    await api.post(`${BASE_URL}/admin/recalculate-step`, payload, {
      ...(lang && { params: { lang: formatLang(lang) } }),
      headers: getHeaders(cashRegisterId),
    });
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to add recalculation price."),
    );
  }
};

export const getIronPrices = async (
  ironTypeId: number,
  cashRegisterId: number,
  lang: string = "en",
  carModelId?: number,
  customerTypeId?: number,
): Promise<IronPrice[]> => {
  try {
    if (!ironTypeId) {
      throw new Error("ironTypeId is required");
    }

    const params: Record<string, string | number> = {
      lang: formatLang(lang),
    };

    if (carModelId !== undefined && carModelId !== null && !isNaN(carModelId)) {
      params.carModelId = carModelId;
    }

    if (
      customerTypeId !== undefined &&
      customerTypeId !== null &&
      !isNaN(customerTypeId)
    ) {
      params.customerTypeId = customerTypeId;
    }

    const response = await api.get(`${BASE_URL}/irontypes-prices`, {
      params,
      headers: getHeaders(cashRegisterId),
    });

    return Array.isArray(response.data)
      ? response.data
      : (response.data.items ?? []);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch iron prices."));
  }
};

export const updateCarModel = async (
  id: number,
  payload: CarModelPayload,
  cashRegisterId: number,
  lang: string = "en",
): Promise<CarModel> => {
  try {
    const response = await api.put(`${BASE_URL}/iron-types/${id}`, payload, {
      params: { lang: formatLang(lang) },
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update car model."));
  }
};

export const updateIronType = async (
  id: number,
  payload: CarModelPayload,
  cashRegisterId: number,
  lang: string = "en",
): Promise<IronType> => {
  try {
    const response = await api.put(`${BASE_URL}/UpdateIronType/${id}`, payload, {
      params: { lang: formatLang(lang) },
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update iron type."));
  }
};

export const updateIronTypePrices = async (
  payload: UpdateIronTypePricesPayload,
  cashRegisterId: number,
): Promise<void> => {
  try {
    await api.post(`${BASE_URL}/UpdateIronTypePrices`, payload, {
      headers: getHeaders(cashRegisterId),
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update iron prices."));
  }
};

export const deleteCarModel = async (id: number) => {
  try {
    const response = await api.delete(`${BASE_URL}/car-model/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to delete CarModel."));
  }
};

export const deleteIronType = async (id: number) => {
  try {
    const response = await api.delete(`${BASE_URL}/iron-type/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to delete IronType."));
  }
};
