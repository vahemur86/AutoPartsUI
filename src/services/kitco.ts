import axios from "axios";
import api from ".";
import type {
  KitcoConnectionTestResult,
  KitcoQuotaSnapshot,
  KitcoSettings,
  KitcoSettingsFieldErrors,
  KitcoSettingsPayload,
  KitcoStatus,
} from "@/types/kitco";
import { KitcoApiError } from "@/types/kitco";

const base = "/kitco";
const settingsFields: Array<keyof KitcoSettingsPayload> = [
  "url",
  "cacheMinutes",
  "warningThreshold",
  "requestTimeoutSeconds",
  "availabilityCheckIntervalMinutes",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isSafeMessage = (value: string) =>
  value.length < 400 && !/[\r\n]|\bat\s+[\w$.<>]+\s*\(/i.test(value);

const fieldErrorsFrom = (data: unknown): KitcoSettingsFieldErrors => {
  if (!isRecord(data) || !isRecord(data.errors)) return {};
  const fieldErrors: KitcoSettingsFieldErrors = {};
  for (const [key, value] of Object.entries(data.errors)) {
    const field = settingsFields.find(
      (candidate) => candidate.toLowerCase() === key.toLowerCase(),
    );
    const message = Array.isArray(value) ? value.find((item) => typeof item === "string") : value;
    if (field && typeof message === "string" && isSafeMessage(message)) {
      fieldErrors[field] = message;
    }
  }
  return fieldErrors;
};

const errorMessageFrom = (data: unknown, fallback: string) => {
  if (!isRecord(data)) return fallback;
  for (const key of ["message", "error", "title"]) {
    if (typeof data[key] === "string" && data[key]) return data[key];
  }
  return fallback;
};

const throwKitcoError = (error: unknown, fallback: string): never => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const statusCode = error.response?.status ?? 0;
    const code = isRecord(data) && typeof data.code === "string" ? data.code : "";
    const message = statusCode === 402 || code === "PaymentRequired"
      ? "Kitco request quota is exhausted. Payment is required to resume service."
      : errorMessageFrom(data, fallback);
    throw new KitcoApiError(
      message,
      statusCode,
      fieldErrorsFrom(data),
      statusCode === 402 ? quotaFrom(data) : null,
    );
  }
  throw new KitcoApiError(fallback, 0);
};

const quotaFrom = (data: unknown): KitcoQuotaSnapshot | null => {
  if (!isRecord(data)) return null;
  const quota: KitcoQuotaSnapshot = {};
  if (typeof data.requestsUsed === "number") quota.requestsUsed = data.requestsUsed;
  if (typeof data.requestLimit === "number") quota.requestLimit = data.requestLimit;
  if (typeof data.requestsRemaining === "number") quota.requestsRemaining = data.requestsRemaining;
  if (typeof data.paymentWarning === "boolean") quota.paymentWarning = data.paymentWarning;
  if (typeof data.paymentRequired === "boolean") quota.paymentRequired = data.paymentRequired;
  return Object.keys(quota).length ? quota : null;
};

export const getKitcoSettings = async (): Promise<KitcoSettings> => {
  try {
    const { data } = await api.get<KitcoSettings>(`${base}/settings`);
    return data;
  } catch (error) {
    return throwKitcoError(error, "Could not load Kitco settings.");
  }
};

export const getKitcoStatus = async (): Promise<KitcoStatus> => {
  try {
    const { data } = await api.get<KitcoStatus>(`${base}/status`);
    return data;
  } catch (error) {
    return throwKitcoError(error, "Could not load Kitco status.");
  }
};

export const updateKitcoSettings = async (
  payload: KitcoSettingsPayload,
): Promise<KitcoSettings> => {
  try {
    const { data } = await api.put<KitcoSettings>(`${base}/settings`, payload);
    return data;
  } catch (error) {
    return throwKitcoError(error, "Could not save Kitco settings.");
  }
};

export const testKitcoConnection = async (): Promise<KitcoConnectionTestResult> => {
  try {
    const { data } = await api.post<KitcoConnectionTestResult>(`${base}/test-connection`);
    return data;
  } catch (error) {
    return throwKitcoError(error, "Could not test Kitco connection.");
  }
};

export const kitcoQuotaFromStatus = (status: KitcoStatus): KitcoQuotaSnapshot => ({
  requestsUsed: status.requestsUsed,
  requestLimit: status.requestLimit,
  requestsRemaining: status.requestsRemaining,
  paymentWarning: status.paymentWarning,
  paymentRequired: status.paymentRequired,
});
