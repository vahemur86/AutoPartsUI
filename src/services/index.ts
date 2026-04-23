import axios from "axios";

//  Azure API base URL
const DEFAULT_API_BASE_URL =
  "https://autoparts-ambpc7hjbqhxeebx.canadacentral-01.azurewebsites.net/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
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
  (response) => response,
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
        const event = new CustomEvent("otp:required", {
          detail: {
            pageKey,  // ← pass it along
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

    return Promise.reject(error);
  },
);

export default api;
