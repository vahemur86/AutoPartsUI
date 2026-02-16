import api from ".";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type {
  Customer,
  CreateCustomerRequest,
  CustomersResponse,
} from "@/types/operator";

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

    const response = await api.get<CustomersResponse>(`/catalyst/customers`, {
      params: queryParams,
      headers: getHeaders(cashRegisterId),
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
        headers: {
          ...(cashRegisterId && {
            "X-CashRegister-Id": cashRegisterId,
          }),
        },
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
