import api from "@/services";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { OpenSession, OpenSessionSummary } from "@/types/cash";

interface Params {
  shopId?: number;
  cashRegisterId: number;
}

export const getOpenSessions = async ({ shopId, cashRegisterId }: Params) => {
  try {
    const response = await api.get<OpenSession[]>(
      `/admin/cash-dashboard/open-sessions`,
      {
        params: {
          shopId,
        },
        headers: {
          "X-CashRegister-Id": cashRegisterId,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get open sessions."));
  }
};

export const getOpenSessionsSummary = async ({
  shopId,
  cashRegisterId,
}: Params) => {
  try {
    const response = await api.get<OpenSessionSummary[]>(
      `/admin/cash-dashboard/open-sessions/summary`,
      {
        params: {
          shopId,
        },
        headers: {
          "X-CashRegister-Id": cashRegisterId,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get open sessions summary."),
    );
  }
};
