import api from "..";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  CashRegister,
  CashRegisterBalance,
  GetCashRegisterSession,
  TopUpRequest,
} from "@/types/settings";

export const getCashRegisters = async (shopId?: number) => {
  try {
    const params = shopId ? { shopId } : {};
    const response = await api.get("/cash-registers", { params });
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
        headers: {
          "X-CashRegister-Id": cashRegisterId,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get cash register balance."),
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
        headers: {
          "X-CashRegister-Id": cashRegisterId,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to open session."));
  }
};

export const closeCashRegisterSession = async ({
  sessionId,
  cashRegisterId,
}: {
  sessionId: number;
  cashRegisterId: number;
}) => {
  try {
    const response = await api.post(
      `/cashbox-sessions/${sessionId}/close`,
      {},
      {
        headers: {
          "X-CashRegister-Id": cashRegisterId,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to close session."));
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
    console.log(cashRegisterId, "000cashRegisterId");
    const response = await api.post(
      `/cash-registers/${cashRegisterId}/operators`,
      { userId },
      {
        headers: {
          "X-CashRegister-Id": cashRegisterId,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to assign operator to register."),
    );
  }
};

export const getCashRegisterSession = async (cashRegisterId: number) => {
  try {
    const response = await api.get<GetCashRegisterSession>(
      `/cash-sessions/Get-Register-session`,
      {
        headers: {
          "X-CashRegister-Id": cashRegisterId,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get session."));
  }
};
