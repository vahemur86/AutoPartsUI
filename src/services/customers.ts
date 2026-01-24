import api from ".";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { Customer } from "@/types/operator";

export interface GetOrCreateCustomerRequest {
  phone: string;
}

export interface UpdateCustomerTypeRequest {
  customerTypeId: number;
}

export interface GetCustomersParams {
  phone?: string;
  customerTypeId?: number;
  page?: number;
  pageSize?: number;
}

export interface CustomersResponse {
  items: Customer[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export type CustomersApiResponse = Customer[] | CustomersResponse;

export const getOrCreateCustomer = async (
  phone: string,
): Promise<Customer> => {
  try {
    const response = await api.post<Customer>(
      `/catalyst/customers/get-or-create`,
      { phone },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get or create customer."),
    );
  }
};

export const getCustomers = async (
  params?: GetCustomersParams,
): Promise<CustomersApiResponse> => {
  try {
    const response = await api.get<CustomersApiResponse>(`/catalyst/customers`, {
      params,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get customers."));
  }
};

export const updateCustomerType = async (
  customerId: number,
  customerTypeId: number,
): Promise<Customer> => {
  try {
    const response = await api.put<Customer>(
      `/catalyst/customers/${customerId}/type`,
      { customerTypeId },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update customer type."),
    );
  }
};

