import axios from "axios";
import api from ".";
import {
  AzureEmailApiError,
  type AzureEmailSettings,
  type AzureEmailSettingsFieldErrors,
  type AzureEmailSettingsPayload,
  type AzureEmailTestPayload,
  type AzureEmailTestResult,
} from "@/types/azureEmail";

const base = "/azure-email";
const fields: Array<keyof AzureEmailSettingsPayload | "recipientEmail"> = [
  "endpoint",
  "senderAddress",
  "authenticationMode",
  "accessKey",
  "isEnabled",
  "invitationSubject",
  "invitationMessage",
  "invitationTextBody",
  "invitationHtmlBody",
  "passwordResetSubject",
  "passwordResetMessage",
  "passwordResetTextBody",
  "passwordResetHtmlBody",
  "recipientEmail",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const redact = (message: string, secret: string) =>
  secret ? message.split(secret).join("[redacted]") : message;

const isSafeMessage = (message: string) =>
  message.length < 400 && !/[\r\n]|\bat\s+[\w$.<>]+\s*\(/i.test(message);

const fieldErrorsFrom = (
  data: unknown,
  secret: string,
): AzureEmailSettingsFieldErrors => {
  if (!isRecord(data) || !isRecord(data.errors)) return {};
  const fieldErrors: AzureEmailSettingsFieldErrors = {};
  for (const [key, value] of Object.entries(data.errors)) {
    const field = fields.find(
      (candidate) => candidate.toLowerCase() === key.toLowerCase(),
    );
    const message = Array.isArray(value)
      ? value.find((item) => typeof item === "string")
      : value;
    if (field && typeof message === "string") {
      const safe = redact(message, secret);
      if (isSafeMessage(safe)) fieldErrors[field] = safe;
    }
  }
  return fieldErrors;
};

const messageFrom = (data: unknown, fallback: string, secret: string) => {
  if (isRecord(data)) {
    for (const key of ["error", "message", "title"]) {
      const message = data[key];
      if (typeof message === "string") {
        const safe = redact(message, secret);
        if (isSafeMessage(safe)) return safe;
      }
    }
  }
  return fallback;
};

const throwAzureEmailError = (
  error: unknown,
  fallback: string,
  secret = "",
): never => {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    throw new AzureEmailApiError(
      messageFrom(data, fallback, secret),
      error.response?.status ?? 0,
      fieldErrorsFrom(data, secret),
    );
  }
  throw new AzureEmailApiError(fallback, 0);
};

export const getAzureEmailSettings = async (): Promise<AzureEmailSettings> => {
  try {
    const { data } = await api.get<AzureEmailSettings>(`${base}/settings`);
    return data;
  } catch (error) {
    return throwAzureEmailError(error, "Could not load Azure Email settings.");
  }
};

export const updateAzureEmailSettings = async (
  payload: AzureEmailSettingsPayload,
): Promise<AzureEmailSettings> => {
  try {
    const { data } = await api.put<AzureEmailSettings>(`${base}/settings`, payload);
    return data;
  } catch (error) {
    return throwAzureEmailError(
      error,
      "Could not save Azure Email settings.",
      payload.accessKey ?? "",
    );
  }
};

export const sendAzureEmailTest = async (
  payload: AzureEmailTestPayload,
): Promise<AzureEmailTestResult> => {
  try {
    const { data } = await api.post<AzureEmailTestResult>(
      `${base}/test-send`,
      payload,
    );
    return data;
  } catch (error) {
    return throwAzureEmailError(error, "Could not send the test email.");
  }
};
