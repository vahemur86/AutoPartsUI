// api
import api from ".";

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
} from "@/types/ironCarShop";

const BASE_URL = "/admin/iron-shop";

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

    const items = Array.isArray(response.data) ? response.data : [];
    const translationKey = mapI18nCodeToApiCode(lang);

    // Normalize items to ensure a `name` field is available for the UI
    return items.map((it: any) => ({
      id: it.id,
      name:
        it.name || (it.translations && it.translations[translationKey]) || it.code || "",
    }));
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch car models."));
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
  dictBrandId: number,
  customerTypeId: number,
  cashRegisterId: number,
  lang: string = "en",
): Promise<any[]> => {
  try {
    const response = await api.get(`${BASE_URL}/available-types`, {
      params: { 
        dictBrandId, 
        customerTypeId,
        lang: formatLang(lang) 
      },
      headers: getHeaders(cashRegisterId),
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch available iron types."));
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

export const getIronSales = async (
  params: GetIronSalesParams,
  cashRegisterId: number,
): Promise<PurchaseIronResponse[]> => {
  try {
    const response = await api.get(`${BASE_URL}/GetPurchases`, {
      params: {
        customerId: params.customerId,
        lang: params.lang ? formatLang(params.lang) : undefined,
      },
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch iron sales."));
  }
};

export const getIronPurchasesReport = async (
  params: GetIronPurchasesReportParams,
  cashRegisterId: number,
): Promise<IronPurchasesReportResponse> => {
  try {
    const response = await api.get(`${BASE_URL}/reports/purchases`, {
      params: {
        ...params,
        lang: params.lang ? formatLang(params.lang) : undefined,
      },
      headers: getHeaders(cashRegisterId),
    });

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch iron purchases report."));
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
): Promise<void> => {
  try {
    await api.post(`${BASE_URL}/admin/recalculate-step`, payload, {
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
