import api from "@/services";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { GetRegisterSession } from "@/types/cash";

export const getRegisterSession = async (cashRegisterId: number) => {
  try {
    const response = await api.get<GetRegisterSession>(
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
