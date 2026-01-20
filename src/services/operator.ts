import type { MetalRate } from "@/types/operator";
import api from ".";

// utils
import { getApiErrorMessage } from "@/utils";

export interface GetOrCreateCustomerRequest {
  phone: string;
}

export interface GetOrCreateCustomerResponse {
  // The exact structure will be determined based on the API response
  // For now, we'll use a generic type that can be logged
  [key: string]: any;
}

export const getOrCreateCustomer = async (
  phone: string
): Promise<GetOrCreateCustomerResponse> => {
  try {
    const response = await api.post<GetOrCreateCustomerResponse>(
      `/catalyst/customers/get-or-create`,
      {
        phone,
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get or create customer.")
    );
  }
};

export const getMetalRates = async (): Promise<MetalRate[]> => {
  try {
    const response = await api.get<MetalRate[]>(`/metal-rates`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get metal rates."));
  }
};
