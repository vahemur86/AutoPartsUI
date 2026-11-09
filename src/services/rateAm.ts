import axios from "axios";
import api from ".";
import {
  RateAmApiError,
  type RateAmConnectionTestResult,
  type RateAmSettings,
  type RateAmSettingsFieldErrors,
  type RateAmSettingsPayload,
  type RateAmStatus,
} from "@/types/rateAm";

const base = "/rate-am";
const settingsFields: Array<keyof RateAmSettingsPayload> = [
  "url",
  "cacheMinutes",
  "warningDays",
  "requestTimeoutSeconds",
  "availabilityCheckIntervalMinutes",
  "isEnabled",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const safeMessage = (message: string) =>
  message.length < 400 && !/[\r\n]|\bat\s+[\w$.<>]+\s*\(/i.test(message);

const fieldErrorsFrom = (data: unknown): RateAmSettingsFieldErrors => {
  if (!isRecord(data) || !isRecord(data.errors)) return {};
  const errors: RateAmSettingsFieldErrors = {};
  for (const [key, value] of Object.entries(data.errors)) {
    const field = settingsFields.find(
      (candidate) => candidate.toLowerCase() === key.toLowerCase(),
    );
    const message = Array.isArray(value)
      ? value.find((item) => typeof item === "string")
      : value;
    if (field && typeof message === "string" && safeMessage(message)) {
      errors[field] = message;
    }
  }
  return errors;
};

const messageFrom = (data: unknown, fallback: string) => {
  if (!isRecord(data)) return fallback;
  for (const key of ["message", "error", "title"]) {
    const message = data[key];
    if (typeof message === "string" && safeMessage(message)) return message;
  }
  return fallback;
};

const throwRateAmError = (error: unknown, fallback: string): never => {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    throw new RateAmApiError(
      messageFrom(data, fallback),
      error.response?.status ?? 0,
      fieldErrorsFrom(data),
    );
  }
  throw new RateAmApiError(fallback, 0);
};

export const getRateAmSettings = async (): Promise<RateAmSettings> => {
  try {
    const { data } = await api.get<RateAmSettings>(`${base}/settings`);
    return data;
  } catch (error) {
    return throwRateAmError(error, "Could not load Rate.am settings.");
  }
};

export const getRateAmStatus = async (): Promise<RateAmStatus> => {
  try {
    const { data } = await api.get<RateAmStatus>(`${base}/status`);
    return data;
  } catch (error) {
    return throwRateAmError(error, "Could not load Rate.am status.");
  }
};

export const updateRateAmSettings = async (
  payload: RateAmSettingsPayload,
): Promise<RateAmSettings> => {
  try {
    const { data } = await api.put<RateAmSettings>(`${base}/settings`, payload);
    return data;
  } catch (error) {
    return throwRateAmError(error, "Could not save Rate.am settings.");
  }
};

export const testRateAmConnection =
  async (): Promise<RateAmConnectionTestResult> => {
    try {
      const { data } = await api.post<RateAmConnectionTestResult>(
        `${base}/test-connection`,
      );
      return data;
    } catch (error) {
      return throwRateAmError(error, "Could not test Rate.am connection.");
    }
  };
