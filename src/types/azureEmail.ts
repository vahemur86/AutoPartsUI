export type AzureEmailAuthenticationMode = "ManagedIdentity" | "AccessKey";

export type AzureEmailTestStatus = "NotTested" | "Succeeded" | "Failed";

export interface AzureEmailSettings {
  endpoint: string;
  senderAddress: string;
  authenticationMode: AzureEmailAuthenticationMode;
  accessKeyConfigured: boolean;
  isEnabled: boolean;
  invitationSubject: string;
  invitationMessage: string;
  invitationTextBody: string;
  invitationHtmlBody: string;
  passwordResetSubject: string;
  passwordResetMessage: string;
  passwordResetTextBody: string;
  passwordResetHtmlBody: string;
  updatedAt: string | null;
  lastTestAt: string | null;
  lastTestStatus: AzureEmailTestStatus;
  lastTestError: string | null;
}

export interface AzureEmailSettingsPayload {
  endpoint: string;
  senderAddress: string;
  authenticationMode: AzureEmailAuthenticationMode;
  accessKey: string | null;
  isEnabled: boolean;
  invitationSubject: string;
  invitationMessage: string;
  invitationTextBody: string;
  invitationHtmlBody: string;
  passwordResetSubject: string;
  passwordResetMessage: string;
  passwordResetTextBody: string;
  passwordResetHtmlBody: string;
}

export interface AzureEmailTestPayload {
  recipientEmail: string;
}

export interface AzureEmailTestResult {
  isSuccess: boolean;
  checkedAt: string;
  error: string | null;
  updatedAt: string;
}

export type AzureEmailSettingsFieldErrors = Partial<
  Record<keyof AzureEmailSettingsPayload | "recipientEmail", string>
>;

export class AzureEmailApiError extends Error {
  readonly statusCode: number;
  readonly fieldErrors: AzureEmailSettingsFieldErrors;

  constructor(
    message: string,
    statusCode: number,
    fieldErrors: AzureEmailSettingsFieldErrors = {},
  ) {
    super(message);
    this.name = "AzureEmailApiError";
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}
