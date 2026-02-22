// api
import api from ".";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type {
  CarModel,
  IronType,
  IronTypeByCar,
  IronPricesResponse,
  BulkPurchasePayload,
  PurchaseIronResponse,
  IronPrice,
  AddIronPricePayload,
  CarModelPayload,
  GetIronSalesParams,
} from "@/types/ironCarShop";

const BASE_URL = "/admin/carmodels";

const formatLang = (lang: string) => (lang === "am" ? "arm" : lang);

export const getCarModels = async (
  cashRegisterId: number,
  lang: string = "en",
): Promise<CarModel[]> => {
  try {
    const response = await api.get(`${BASE_URL}/GetCarModels`, {
      params: { lang: formatLang(lang) },
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
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

export const bulkPurchaseIron = async (
  payload: BulkPurchasePayload,
  cashRegisterId: number,
  lang: string = "en",
): Promise<PurchaseIronResponse[]> => {
  try {
    const response = await api.post(`${BASE_URL}/BulkPurchase`, payload, {
      params: { lang: formatLang(lang) },
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed bulk purchase."));
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

export const addCarModel = async (
  payload: CarModelPayload,
  cashRegisterId: number,
  lang: string = "en",
): Promise<CarModel> => {
  try {
    const response = await api.post(`${BASE_URL}/AddCarModel`, payload, {
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
      params: {
        ...params,
      },
      headers: getHeaders(cashRegisterId),
    });
    return Array.isArray(response.data)
      ? response.data
      : (response.data.items ?? []);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch iron prices."));
  }
};
