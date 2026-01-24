import api from "..";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { CustomerType } from "@/types/settings";

export const getCustomerTypes = async () => {
  try {
    const response = await api.get("/admin/customer-types");
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get customer types."),
    );
  }
};

export const createCustomerType = async (
  customerType: Omit<CustomerType, "id" | "isActive">,
) => {
  try {
    const response = await api.post("/admin/customer-types", customerType);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create customer type."),
    );
  }
};

export const updateCustomerType = async (
  id: number,
  customerType: Omit<CustomerType, "id">,
) => {
  try {
    const response = await api.put(`/admin/customer-types/${id}`, customerType);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update customer type."),
    );
  }
};

