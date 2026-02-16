// services
import api from "@/services";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type {
  Batch,
  BatchDetails,
  BatchResponse,
  ZReport,
  ZReportResponse,
  CashboxReport,
} from "@/types/cash";

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
      { headers: getHeaders(cashRegisterId) },
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to close session."));
  }
};

export const getZReport = async ({
  sessionId,
  cashRegisterId,
}: {
  sessionId: number;
  cashRegisterId?: number;
}) => {
  try {
    const { data } = await api.get<ZReport>(
      `/cashbox-sessions/${sessionId}/z-report`,
      { headers: getHeaders(cashRegisterId) },
    );
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to get z-report."));
  }
};

export const getZReports = async ({
  cashRegisterId,
  ...params
}: {
  fromDate?: string;
  toDate?: string;
  cashRegisterId?: number;
  page?: number;
  pageSize?: number;
}) => {
  try {
    const { data } = await api.get<ZReportResponse>(
      `/cashbox-sessions/z-reports`,
      {
        params,
        headers: getHeaders(cashRegisterId),
      },
    );
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to get z-reports."));
  }
};

export const getBatches = async ({
  cashRegisterId,
  ...params
}: {
  fromDate?: string;
  toDate?: string;
  cashRegisterId?: number;
  page?: number;
  pageSize?: number;
}) => {
  try {
    const { data } = await api.get<BatchResponse>(`/cashbox-sessions/batches`, {
      params,
      headers: getHeaders(cashRegisterId),
    });
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to get batches."));
  }
};

export const getBatch = async ({
  sessionId,
  cashRegisterId,
}: {
  sessionId: number;
  cashRegisterId: number;
}) => {
  try {
    const { data } = await api.get<Batch>(
      `/cashbox-sessions/${sessionId}/batch`,
      { headers: getHeaders(cashRegisterId) },
    );
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to get batch."));
  }
};

export const getBatchDetails = async ({
  sessionId,
  cashRegisterId,
}: {
  sessionId: number;
  cashRegisterId?: number;
}) => {
  try {
    const { data } = await api.get<BatchDetails>(
      `/cashbox-sessions/${sessionId}/batch-details`,
      { headers: getHeaders(cashRegisterId) },
    );
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to get batch details."));
  }
};

export const getCashboxReport = async ({
  cashRegisterId,
  dateFrom,
  dateTo,
}: {
  cashRegisterId: number;
  dateFrom?: string;
  dateTo?: string;
}) => {
  try {
    const { data } = await api.get<CashboxReport>(
      `/cashbox-sessions/${cashRegisterId}/reports/cash`,
      {
        params: { datefrom: dateFrom, dateto: dateTo },
        headers: getHeaders(cashRegisterId),
      },
    );
    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to get cashbox report."));
  }
};
