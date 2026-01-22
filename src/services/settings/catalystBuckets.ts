import api from "..";
// utils
import { getApiErrorMessage } from "@/utils";
// types
import type { CatalystBucket } from "@/types/settings";

export const createCatalystBucket = async (catalystBucket: {
  code: string;
  ptWeight: number;
  pdWeight: number;
  rhWeight: number;
}) => {
  try {
    const response = await api.post(
      "/superadmin/catalyst-buckets",
      catalystBucket,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create catalyst bucket."),
    );
  }
};

export const getCatalystBuckets = async (includeInactive = false) => {
  try {
    const response = await api.get("/superadmin/catalyst-buckets", {
      params: {
        includeInactive,
      },
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch catalyst buckets."),
    );
  }
};

export const getSingleCatalystBucket = async (
  code: string,
  currencyCode: string = "AMD",
) => {
  try {
    const response = await api.get("/superadmin/catalyst-buckets/quote", {
      params: {
        code,
        currencyCode,
      },
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get catalyst bucket quote."),
    );
  }
};

export const getCatalystBucketsByCode = async (code: string) => {
  try {
    const response = await api.get(`/superadmin/catalyst-buckets/${code}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get catalyst buckets by code."),
    );
  }
};

export const updateCatalystBucket = async (
  id: number,
  payload: Omit<CatalystBucket, "id">,
) => {
  try {
    const response = await api.put(
      `/superadmin/catalyst-buckets/${id}`,
      payload,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update catalyst bucket."),
    );
  }
};
