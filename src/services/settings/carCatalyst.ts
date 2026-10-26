import api from "..";
import { getApiErrorMessage, getHeaders } from "@/utils";
import type {
  CreateCarCatalyst,
  CarCatalyst,
  CarCatalystSearchParams,
} from "@/types/settings";

export const createCarCatalyst = async (
  data: CreateCarCatalyst,
  cashRegisterId?: number,
) => {
  try {
    const response = await api.post("/car-catalyst", data, {
      headers: getHeaders(cashRegisterId),
    });

    return response.data as CarCatalyst;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create car catalyst."),
    );
  }
};

export const updateCarCatalyst = async (
  id: number,
  data: CreateCarCatalyst,
  cashRegisterId?: number,
) => {
  try {
    const response = await api.put(`/car-catalyst/${id}`, data, {
      headers: getHeaders(cashRegisterId),
    });

    return response.data as CarCatalyst;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update car catalyst."),
    );
  }
};

export const getCarCatalystById = async (
  id: number,
  cashRegisterId?: number,
) => {
  try {
    const response = await api.get(`/car-catalyst/${id}`, {
      headers: getHeaders(cashRegisterId),
    });

    return response.data as CarCatalyst;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get car catalyst."));
  }
};

export const deleteCarCatalyst = async (
  id: number,
  cashRegisterId?: number,
) => {
  try {
    const response = await api.delete(`/car-catalyst/${id}`, {
      headers: getHeaders(cashRegisterId),
    });

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to delete car catalyst."),
    );
  }
};

export const searchCarCatalysts = async (
  params: CarCatalystSearchParams,
  cashRegisterId?: number,
) => {
  try {
    const response = await api.get("/car-catalyst/search", {
      params,
      headers: getHeaders(cashRegisterId),
    });

    const data = response.data as CarCatalyst[] | { results?: CarCatalyst[]; items?: CarCatalyst[]; data?: CarCatalyst[] };
    if (Array.isArray(data)) return data;
    return data.results ?? data.items ?? data.data ?? [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to search car catalysts."),
    );
  }
};
