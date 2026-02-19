import api from "@/services";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";
import type {
  CashRegister,
  CashRegisterBalance,
  TopUpRequest,
  PendingTransaction,
} from "@/types/cash";

export const getCashRegisters = async (shopId?: number) => {
  try {
    const response = await api.get("/cash-registers", {
      params: {
        shopId,
      },
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get cash registers."));
  }
};

export const createCashRegister = async (
  cashRegister: Omit<CashRegister, "id" | "isActive">,
) => {
  try {
    const response = await api.post("/cash-registers", cashRegister);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create cash register."),
    );
  }
};

export const updateCashRegister = async (
  id: number,
  cashRegister: Omit<CashRegister, "id" | "shopId">,
) => {
  try {
    const response = await api.put(`/cash-registers/${id}`, cashRegister);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update cash register."),
    );
  }
};

export const deleteCashRegister = async (id: number) => {
  try {
    const response = await api.delete(`/cash-registers/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to delete cash register."),
    );
  }
};

export const getCashRegisterBalance = async (cashRegisterId: number) => {
  try {
    const response = await api.get<CashRegisterBalance>(
      `/cash-registers/${cashRegisterId}/balance`,
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get cash register balance."),
    );
  }
};

export interface CashRegisterOperatorLink {
  userId: number;
  isActive: boolean;
  username: string;
}

export const getCashRegisterOperators = async (cashRegisterId: number) => {
  try {
    const response = await api.get<CashRegisterOperatorLink[]>(
      `/cash-registers/${cashRegisterId}/operators`,
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get cash register operators."),
    );
  }
};

export const topUpCashRegister = async (
  id: number,
  topUpData: TopUpRequest,
) => {
  try {
    const response = await api.post(
      `/cash-registers/${id}/balance/top-up`,
      topUpData,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to top up cash register."),
    );
  }
};

export const openCashRegisterSession = async (cashRegisterId: number) => {
  try {
    const response = await api.post<{
      sessionId: number;
    }>(
      `/cash-registers/${cashRegisterId}/sessions/open`,
      {},
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to open session."));
  }
};

export const assignOperatorToCashRegister = async ({
  cashRegisterId,
  userId,
}: {
  cashRegisterId: number;
  userId: number;
}) => {
  try {
    const response = await api.post(
      `/cash-registers/${cashRegisterId}/operators`,
      { userId },
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to assign operator to register."),
    );
  }
};

export const checkPendingStatus = async (cashBoxId: number) => {
  try {
    const response = await api.get(
      `/cash-registers/${cashBoxId}/check-pending`,
      {
        headers: getHeaders(cashBoxId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to check pending status."),
    );
  }
};

export const getPendingTransaction = async (cashBoxId: number) => {
  try {
    const response = await api.get<PendingTransaction>(
      `/cash-registers/${cashBoxId}/pending`,
      {
        headers: getHeaders(cashBoxId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get pending transaction details."),
    );
  }
};

export const confirmCashRegister = async (cashBoxId: number) => {
  try {
    const response = await api.post(
      `/cash-registers/${cashBoxId}/confirm`,
      {},
      {
        headers: getHeaders(cashBoxId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to confirm cash register transaction."),
    );
  }
};
