import api from "@/services";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type {
  OpenSession,
  OpenSessionSummary,
  PowderBatchResponse,
  GetPowderBatchesParams,
  PowderBatchesSummary,
} from "@/types/cash";

interface Params {
  shopId?: number;
  cashRegisterId?: number;
}

export const getOpenSessions = async ({ shopId, cashRegisterId }: Params) => {
  try {
    const response = await api.get<OpenSession[]>(
      `/admin/cash-dashboard/open-sessions`,
      {
        params: {
          shopId,
        },
        headers: getHeaders(cashRegisterId),
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
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get open sessions summary."),
    );
  }
};

export const getPowderBatches = async ({
  cashRegisterId,
  fromDate,
  toDate,
  page = 1,
  pageSize = 50,
}: GetPowderBatchesParams) => {
  try {
    const { data } = await api.get<PowderBatchResponse>(
      `/cashbox-sessions/batches`,
      {
        params: {
          fromDate,
          toDate,
          cashRegisterId,
          page,
          pageSize,
        },
        headers: getHeaders(cashRegisterId),
      },
    );
    return data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get powder batches."));
  }
};

export const getPowderBatchesSummary = async () => {
  try {
    const { data } = await api.get<PowderBatchesSummary>(
      `/cashbox-sessions/powder/summary`,
    );
    return data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get powder batches summary."),
    );
  }
};

export const getPowderBatchesSummaryByDate = async ({
  dateFrom,
  dateTo,
  cashRegisterId,
}: {
  dateFrom: string;
  dateTo: string;
  cashRegisterId: number;
}) => {
  try {
    const { data } = await api.get<PowderBatchesSummary>(
      `/cashbox-sessions/powder/summary-by-date`,
      {
        params: {
          dateFrom,
          dateTo,
        },
        headers: getHeaders(cashRegisterId),
      },
    );
    return data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Failed to get powder batches summary by date.",
      ),
    );
  }
};
