import api from "..";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { CreateExchangeRate, ExchangeRate } from "@/types/settings";

export const getExchangeRates = async () => {
  try {
    const response = await api.get("/admin/exchange-rates");
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch exchange rates."),
    );
  }
};

export const createExchangeRate = async (exchangeRate: CreateExchangeRate) => {
  try {
    const response = await api.post("/admin/exchange-rates", exchangeRate);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create exchange rate."),
    );
  }
};

export const updateExchangeRate = async ({
  id,
  payload,
}: {
  id: number;
  payload: Omit<ExchangeRate, "id">;
}) => {
  try {
    const response = await api.put(`/admin/exchange-rates/${id}`, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update catalyst bucket."),
    );
  }
};

export const updateExchangeRateActivityStatus = async ({
  id,
  action,
}: {
  id: number;
  action: "activate" | "deactivate";
}) => {
  try {
    const response = await api.post(`/admin/exchange-rates/${id}/${action}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, `Failed to ${action} exchange rate.`),
    );
  }
};
