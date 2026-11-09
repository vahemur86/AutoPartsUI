import axios from "axios";
import api from "..";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type { MetalPrice } from "@/types/settings";
import { KitcoApiError, type KitcoQuotaSnapshot } from "@/types/kitco";

const quotaFromHeaders = (
  headers: Record<string, unknown> | undefined,
): KitcoQuotaSnapshot => {
  const quota: KitcoQuotaSnapshot = {};
  const numberHeader = (name: string) => {
    const value = headers?.[name.toLowerCase()];
    if (value === undefined) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const booleanHeader = (name: string) => {
    const value = headers?.[name.toLowerCase()];
    if (typeof value !== "string" && typeof value !== "boolean") return undefined;
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return undefined;
  };
  const used = numberHeader("X-Kitco-Requests-Used");
  const limit = numberHeader("X-Kitco-Request-Limit");
  const remaining = numberHeader("X-Kitco-Requests-Remaining");
  const warning = booleanHeader("X-Kitco-Payment-Warning");
  const required = booleanHeader("X-Kitco-Payment-Required");
  if (used !== undefined) quota.requestsUsed = used;
  if (limit !== undefined) quota.requestLimit = limit;
  if (remaining !== undefined) quota.requestsRemaining = remaining;
  if (warning !== undefined) quota.paymentWarning = warning;
  if (required !== undefined) quota.paymentRequired = required;
  return quota;
};

const quotaFromBody = (data: unknown): KitcoQuotaSnapshot => {
  if (!data || typeof data !== "object") return {};
  const value = data as Record<string, unknown>;
  const quota: KitcoQuotaSnapshot = {};
  if (typeof value.requestsUsed === "number") quota.requestsUsed = value.requestsUsed;
  if (typeof value.requestLimit === "number") quota.requestLimit = value.requestLimit;
  if (typeof value.requestsRemaining === "number") quota.requestsRemaining = value.requestsRemaining;
  if (typeof value.paymentWarning === "boolean") quota.paymentWarning = value.paymentWarning;
  if (typeof value.paymentRequired === "boolean") quota.paymentRequired = value.paymentRequired;
  return quota;
};

export const getMetalPrices = async (
  cashRegisterId: number,
  onQuotaUpdate?: (quota: KitcoQuotaSnapshot) => void,
): Promise<MetalPrice[]> => {
  try {
    const response = await api.get<MetalPrice[]>("/metals/prices", {
      headers: getHeaders(cashRegisterId),
    });
    const quota = quotaFromHeaders(response.headers as Record<string, unknown>);
    if (Object.keys(quota).length) onQuotaUpdate?.(quota);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      const isPaymentRequired = error.response?.status === 402 ||
        (data && typeof data === "object" && (data as Record<string, unknown>).code === "PaymentRequired");
      if (isPaymentRequired) {
        const quota = {
          ...quotaFromHeaders(error.response?.headers as Record<string, unknown> | undefined),
          ...quotaFromBody(data),
          paymentRequired: true,
        };
        onQuotaUpdate?.(quota);
        throw new KitcoApiError("KITCO_PAYMENT_REQUIRED", 402, {}, quota);
      }
    }
    throw new Error(getApiErrorMessage(error, "Failed to get metal prices."));
  }
};
