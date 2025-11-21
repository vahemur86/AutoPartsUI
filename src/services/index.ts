import axios from "axios";

//  Azure API base URL
const DEFAULT_API_BASE_URL =
  "https://prpservice-hthpaqdrfxa0fba5.westeurope-01.azurewebsites.net/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

// axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized access");
    }
    return Promise.reject(error);
  }
);

export default api;
