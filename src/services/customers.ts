import api from ".";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type {
  Customer,
  CreateCustomerRequest,
  CustomersResponse,
  CustomerSearchResult,
} from "@/types/operator";
import { ROUTE_PAGE_KEYS } from "@/constants/pageKeys";

export interface GetCustomersParams {
  phone?: string;
  customerTypeId?: number;
  gender?: number;
  page?: number;
  pageSize?: number;
  cashRegisterId?: number;
}

export const getCustomers = async (
  params?: GetCustomersParams,
): Promise<CustomersResponse> => {
  try {
    const { cashRegisterId, ...queryParams } = params || {};
    const pageKey = ROUTE_PAGE_KEYS.customers;

    const response = await api.get<CustomersResponse>(`/catalyst/customers`, {
      params: queryParams,
      headers: getHeaders(cashRegisterId, pageKey),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get customers."));
  }
};

export const getOrCreateCustomer = async ({
  data,
  cashRegisterId,
}: {
  data: CreateCustomerRequest;
  cashRegisterId?: number;
}): Promise<Customer> => {
  try {
    const response = await api.post<Customer>(
      `/catalyst/customers/get-or-create`,
      data,
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get or create customer."),
    );
  }
};

export const updateCustomerType = async (
  customerId: number,
  customerTypeId: number,
): Promise<Customer> => {
  try {
    const response = await api.put<Customer>(
      `/catalyst/customers/${customerId}/type`,
      {
        customerTypeId,
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update customer type."),
    );
  }
};

export const deleteCustomer = async (customerId: number) => {
  try {
    const response = await api.delete(`/catalyst/customers/${customerId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to delete customer."));
  }
};

export const getCustomerNames = async (
  search?: string,
  cashRegisterId?: number,
): Promise<CustomerSearchResult[]> => {
  try {
    const response = await api.get<CustomerSearchResult[]>(
      `/catalyst/customers/names`,
      {
        params: { search },
        headers: getHeaders(cashRegisterId),
      },
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get customer names."));
  }
};
