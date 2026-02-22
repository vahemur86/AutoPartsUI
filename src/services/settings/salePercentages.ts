import api from "..";

// utils
import { getApiErrorMessage, getHeaders, getCashRegisterId } from "@/utils";

export const createSalePercentage = async (
  percentage: number,
  isActive: boolean,
) => {
  try {
    const cashRegisterId = getCashRegisterId();
    const response = await api.post(
      `/SalePercentages`,
      {
        percentage,
        isActive,
      },
      {
        headers: getHeaders(cashRegisterId),
      },
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create sale percentage."),
    );
  }
};

export const getSalePercentages = async () => {
  try {
    const cashRegisterId = getCashRegisterId();
    const response = await api.get(`/SalePercentages`, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get sale percentages."),
    );
  }
};

export const deleteSalePercentage = async (id: number) => {
  try {
    const cashRegisterId = getCashRegisterId();
    const response = await api.delete(`/SalePercentages/${id}`, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to delete sale percentage."),
    );
  }
};

export const updateSalePercentage = async (
  id: number,
  percentage: number,
  isActive: boolean,
) => {
  try {
    const cashRegisterId = getCashRegisterId();
    const response = await api.put(
      `/SalePercentages/${id}`,
      {
        id,
        percentage,
        isActive,
      },
      {
        headers: getHeaders(cashRegisterId),
      },
    );

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update sale percentage."),
    );
  }
};
