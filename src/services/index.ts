import axios from "axios";
// Note: avoid importing the store here to prevent circular imports.

let isRedirectingToLogin = false;
const loginPathPattern = /\/auth\/login\/?$/i;
const authStorageKeyPattern = /(access.?token|refresh.?token|auth|user|permission|role|shop.?id|warehouse.?id|cash.?register.?id)/i;

export type AuthFailureReason = "deactivated" | "unauthorized";

const isLoginRequest = (url?: string): boolean => {
  if (!url) return false;

  try {
    return loginPathPattern.test(new URL(url, API_BASE_URL).pathname);
  } catch {
    return loginPathPattern.test(url.split(/[?#]/, 1)[0]);
  }
};

const getFailureMessage = (error: unknown): string => {
  if (!error || typeof error !== "object") {
    return typeof error === "string" ? error : "";
  }

  const data = (error as { response?: { data?: unknown } }).response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const response = data as Record<string, unknown>;
    return [response.message, response.error, response.detail, response.title]
      .filter((value): value is string => typeof value === "string")
      .join(" ");
  }

  return error instanceof Error ? error.message : "";
};

const clearStoredAuthentication = () => {
  if (typeof window === "undefined") return;

  const exactKeys = [
    "access_token",
    "refresh_token",
    "user_data",
    "userContext",
    "auth_user",
    "permissions",
    "user_permissions",
    "role",
    "userRole",
    "userType",
    "shopId",
    "shop_id",
    "warehouseId",
    "warehouse_id",
    "cashRegisterId",
    "cash_register_id",
  ];

  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      exactKeys.forEach((key) => storage.removeItem(key));
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (key && authStorageKeyPattern.test(key)) {
          storage.removeItem(key);
        }
      }
    } catch {
      // Keep logout handling functional when browser storage is unavailable.
    }
  }
};

export const handleUnauthorizedResponse = (error: unknown) => {
  if (typeof window === "undefined" || isRedirectingToLogin) return;

  isRedirectingToLogin = true;
  clearStoredAuthentication();

  const message = getFailureMessage(error).toLocaleLowerCase();
  const reason: AuthFailureReason =
    /(deactivat|inactive|disabled|suspended|blocked)/i.test(message)
      ? "deactivated"
      : "unauthorized";
  const event = new CustomEvent("auth:logout", {
    detail: { reason },
    cancelable: true,
  });

  window.dispatchEvent(event);

  const isLoginPage = window.location.pathname.replace(/\/$/, "") === "/login";
  if (!event.defaultPrevented && !isLoginPage) {
    window.location.replace("/login");
  }
};

// Azure API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured.");
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const storage = typeof window !== "undefined" ? window.localStorage : null;
    const token = storage ? storage.getItem("access_token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// api.ts
api.interceptors.response.use(
  (response) => {
    if (isLoginRequest(response.config.url)) {
      isRedirectingToLogin = false;
    }
    return response;
  },
  (error) => {
    const responseData = error.response?.data;
    const isOtpRequired =
      error.response?.status === 403 &&
      (responseData === "OTP_REQUIRED" ||
        responseData?.message === "OTP_REQUIRED" ||
        responseData?.error === "OTP_REQUIRED");

    if (isOtpRequired) {
      // Extract pageKey from the new response format
      const pageKey = responseData?.pageKey ?? null;

      return new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
          reject(error);
          return;
        }

        const event = new CustomEvent("otp:required", {
          detail: {
            pageKey,
            onVerified: async () => {
              try {
                const response = await api.request(error.config);
                resolve(response);
              } catch (retryError) {
                reject(retryError);
              }
            },
            onCancel: () => reject(error),
          },
        });
        window.dispatchEvent(event);
      });
    }

    if (
      error.response?.status === 401 &&
      !isLoginRequest(error.config?.url)
    ) {
      handleUnauthorizedResponse(error);
    }

    return Promise.reject(error);
  },
);

export default api;
