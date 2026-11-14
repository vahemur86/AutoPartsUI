import api from "./index";

import { getApiErrorMessage } from "@/utils";
import type {
  OtherExpenseCreatePayload,
  OtherExpenseItem,
  OtherExpensePaymentFilters,
  OtherExpensePaymentItem,
  OtherExpensePaymentPayload,
  OtherExpensePaymentReport,
  OtherExpensePaymentsReportFilters,
  OtherExpenseReportItem,
  OtherExpenseUpdatePayload,
} from "@/types/otherExpenses";

export const getOtherExpenses = async (): Promise<OtherExpenseItem[]> => {
  try {
    const response = await api.get("/admin/other-expenses");
    return response.data as OtherExpenseItem[];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch other expenses."));
  }
};

export const getOtherExpensesByLocation = async (
  locationId: number,
  locationType: number,
): Promise<OtherExpenseItem[]> => {
  try {
    const response = await api.get("/admin/other-expenses/by-location", {
      params: { locationId, locationType },
    });
    return response.data as OtherExpenseItem[];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch other expenses by location."));
  }
};

export const createOtherExpense = async (
  payload: OtherExpenseCreatePayload,
): Promise<OtherExpenseItem> => {
  try {
    const response = await api.post("/admin/other-expenses", payload);
    return response.data as OtherExpenseItem;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create other expense."));
  }
};

export const updateOtherExpense = async (
  id: number,
  payload: OtherExpenseUpdatePayload,
): Promise<OtherExpenseItem> => {
  try {
    const response = await api.put(`/admin/other-expenses/${id}`, payload);
    return response.data as OtherExpenseItem;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update other expense."));
  }
};

export const deleteOtherExpense = async (id: number): Promise<void> => {
  try {
    await api.delete(`/admin/other-expenses/${id}`);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to delete other expense."));
  }
};

export const createOtherExpensePayment = async (
  expenseId: number,
  payload: OtherExpensePaymentPayload,
): Promise<OtherExpensePaymentItem> => {
  try {
    const response = await api.post<OtherExpensePaymentItem>(
      `/admin/other-expenses/${expenseId}/payments`,
      payload,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to record expense payment."));
  }
};

export const getOtherExpensePayments = async (
  expenseId: number,
  filters: OtherExpensePaymentFilters = {},
): Promise<OtherExpensePaymentReport> => {
  try {
    const response = await api.get<OtherExpensePaymentReport>(
      `/admin/other-expenses/${expenseId}/payments`,
      {
        params: {
          ...filters,
          page: filters.page ?? 1,
          pageSize: filters.pageSize ?? 50,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch expense payments."));
  }
};

export const getOtherExpensePaymentsReport = async (
  filters: OtherExpensePaymentsReportFilters = {},
): Promise<OtherExpensePaymentReport> => {
  try {
    const response = await api.get<OtherExpensePaymentReport>(
      "/admin/other-expenses/payments",
      {
        params: {
          ...filters,
          page: filters.page ?? 1,
          pageSize: filters.pageSize ?? 50,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch expense payment report."));
  }
};

export const getOtherExpensesReport = async (): Promise<OtherExpenseReportItem[]> => {
  try {
    const response = await api.get("/admin/other-expenses/report");
    return response.data as OtherExpenseReportItem[];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch other expenses report."));
  }
};