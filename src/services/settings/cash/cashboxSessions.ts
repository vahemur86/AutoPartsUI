// services
import api from "@/services";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type {
  Batch,
  BatchDetails,
  BatchResponse,
  SessionBatchDetails,
  CloseSessionResult,
  ZReport,
  ZReportResponse,
  CashboxReport,
} from "@/types/cash";
import { ROUTE_PAGE_KEYS } from "@/constants/pageKeys";

export const closeCashRegisterSession = async ({
  sessionId,
  cashRegisterId,
}: {
  sessionId: number;
  cashRegisterId: number;
}): Promise<CloseSessionResult> => {
  try {
    const response = await api.post(
      `/cashbox-sessions/${sessionId}/close`,
      {},
      { headers: getHeaders(cashRegisterId) },
    );
    const data = response.data ?? {};
    return {
      report: data.report ?? data.Report,
      batches: data.batches ?? data.Batches ?? [],
    };
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
    const pageKey = ROUTE_PAGE_KEYS.reports;
    const { data } = await api.get<ZReportResponse>(
      `/cashbox-sessions/z-reports`,
      {
        params,
        headers: getHeaders(cashRegisterId, pageKey),
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
  clientName?: string;
  clientPhone?: string;
  clientTypeId?: number;
  supplierClientId?: number;
  specialOnly?: boolean;
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

export const getSessionBatches = async ({
  sessionId,
  cashRegisterId,
}: {
  sessionId: number;
  cashRegisterId?: number;
}): Promise<Batch[]> => {
  try {
    const { data } = await api.get<Batch[] | Batch>(
      `/cashbox-sessions/${sessionId}/batches`,
      { headers: getHeaders(cashRegisterId) },
    );
    // Compatibility: older backend returned a single batch object.
    return Array.isArray(data) ? data : data ? [data] : [];
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to get session batches."),
    );
  }
};

export const getBatch = async ({
  batchId,
  cashRegisterId,
}: {
  batchId: number;
  cashRegisterId?: number;
}) => {
  try {
    const { data } = await api.get<BatchDetails>(
      `/powder-batches/${batchId}`,
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
  supplierClientId,
}: {
  sessionId: number;
  cashRegisterId?: number;
  supplierClientId?: number;
}): Promise<SessionBatchDetails> => {
  try {
    const { data } = await api.get<BatchDetails[] | BatchDetails>(
      `/cashbox-sessions/${sessionId}/batch-details`,
      {
        params: supplierClientId != null ? { supplierClientId } : undefined,
        headers: getHeaders(cashRegisterId),
      },
    );
    // Compatibility: older backend returned a single details object.
    return Array.isArray(data) ? data : data ? [data] : [];
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
