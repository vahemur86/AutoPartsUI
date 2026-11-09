export type KitcoAvailabilityStatus =
  | "Unknown"
  | "Available"
  | "Unavailable"
  | "ApiError"
  | "PaymentRequired"
  | "Disabled";

export interface KitcoSettings {
  url: string;
  cacheMinutes: number;
  requestLimit: number;
  warningThreshold: number;
  requestTimeoutSeconds: number;
  isEnabled: boolean;
  requestsUsed: number;
  requestsRemaining: number;
  paymentWarning: boolean;
  paymentRequired: boolean;
  lastPaymentConfirmedAt: string | null;
  lastPaymentReference: string | null;
  updatedAt: string | null;
  availabilityStatus: KitcoAvailabilityStatus;
  isAvailable: boolean | null;
  lastAvailabilityCheckAt: string | null;
  lastAvailabilityError: string | null;
  availabilityCheckIntervalMinutes: number;
}

export type KitcoSettingsPayload = Pick<
  KitcoSettings,
  | "url"
  | "cacheMinutes"
  | "warningThreshold"
  | "requestTimeoutSeconds"
  | "availabilityCheckIntervalMinutes"
>;

export type KitcoStatus = Pick<
  KitcoSettings,
  | "isEnabled"
  | "requestsUsed"
  | "requestLimit"
  | "requestsRemaining"
  | "warningThreshold"
  | "paymentWarning"
  | "paymentRequired"
  | "lastPaymentConfirmedAt"
  | "lastPaymentReference"
  | "updatedAt"
  | "availabilityStatus"
  | "isAvailable"
  | "lastAvailabilityCheckAt"
  | "lastAvailabilityError"
  | "availabilityCheckIntervalMinutes"
>;

export interface KitcoConnectionTestResult {
  status: KitcoAvailabilityStatus;
  isAvailable: boolean | null;
  checkedAt: string;
  error: string | null;
  requestsUsed: number;
  requestLimit: number;
  requestsRemaining: number;
  paymentWarning: boolean;
  paymentRequired: boolean;
}

export interface KitcoQuotaSnapshot {
  requestsUsed?: number;
  requestLimit?: number;
  requestsRemaining?: number;
  paymentWarning?: boolean;
  paymentRequired?: boolean;
}

export type KitcoSettingsFieldErrors = Partial<
  Record<keyof KitcoSettingsPayload, string>
>;

export class KitcoApiError extends Error {
  readonly statusCode: number;
  readonly fieldErrors: KitcoSettingsFieldErrors;
  readonly quota: KitcoQuotaSnapshot | null;

  constructor(
    message: string,
    statusCode: number,
    fieldErrors: KitcoSettingsFieldErrors = {},
    quota: KitcoQuotaSnapshot | null = null,
  ) {
    super(message);
    this.name = "KitcoApiError";
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
    this.quota = quota;
  }
}
