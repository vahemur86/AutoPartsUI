// api
import api from ".";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type {
  CarModel,
  IronType,
  IronPricesResponse,
  BulkPurchasePayload,
  PurchaseIronResponse,
} from "@/types/ironCarShop";

const BASE_URL = "/admin/carmodels";

const formatLang = (lang: string) => (lang === "am" ? "hy" : lang);

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
      params: { ...params, lang: formatLang(params.lang || "en") },
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

export interface GetIronSalesParams {
  customerId?: number;
  lang?: string;
}

export const getIronSales = async (
  params: GetIronSalesParams,
  cashRegisterId: number,
): Promise<PurchaseIronResponse[]> => {
  try {
    const response = await api.get(`${BASE_URL}/GetPurchases`, {
      params: {
        customerId: params.customerId,
        lang: formatLang(params.lang || "en"),
      },
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch iron sales."));
  }
};