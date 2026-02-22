import api from "@/services";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type { GetRegisterSession } from "@/types/cash";

export const getRegisterSession = async (cashRegisterId: number) => {
  try {
    const response = await api.get<GetRegisterSession>(
      `/cash-sessions/Get-Register-session`,
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get session."));
  }
};
