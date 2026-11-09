export type RateAmAvailabilityStatus =
  | "Unknown"
  | "Available"
  | "Unavailable"
  | "ApiError"
  | "PaymentRequired"
  | "Disabled";

export interface RateAmStatus {
  isEnabled: boolean;
  requestsUsed: number;
  lastPaymentConfirmedAt: string | null;
  paymentExpiresAt: string | null;
  daysUntilPaymentExpiry: number | null;
  warningDays: number;
  paymentWarning: boolean;
  paymentRequired: boolean;
  lastPaymentReference: string | null;
  availabilityStatus: RateAmAvailabilityStatus;
  isAvailable: boolean | null;
  lastAvailabilityCheckAt: string | null;
  lastAvailabilityError: string | null;
  availabilityCheckIntervalMinutes: number;
}

export interface RateAmSettings extends RateAmStatus {
  url: string;
  cacheMinutes: number;
  requestTimeoutSeconds: number;
}

export interface RateAmSettingsPayload {
  url: string;
  cacheMinutes: number;
  warningDays: number;
  requestTimeoutSeconds: number;
  availabilityCheckIntervalMinutes: number;
  isEnabled: boolean;
}

export interface RateAmConnectionTestResult {
  status: RateAmAvailabilityStatus;
  isAvailable: boolean | null;
  checkedAt: string;
  error: string | null;
  requestsUsed: number;
  paymentExpiresAt: string | null;
  daysUntilPaymentExpiry: number | null;
  paymentWarning: boolean;
  paymentRequired: boolean;
}

export type RateAmSettingsFieldErrors = Partial<
  Record<keyof RateAmSettingsPayload, string>
>;

export class RateAmApiError extends Error {
  readonly statusCode: number;
  readonly fieldErrors: RateAmSettingsFieldErrors;

  constructor(
    message: string,
    statusCode: number,
    fieldErrors: RateAmSettingsFieldErrors = {},
  ) {
    super(message);
    this.name = "RateAmApiError";
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}
