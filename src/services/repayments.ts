import { api } from "@/services/index";

export interface RepaymentListItemDto {
  id: string;
  repaymentNumber: string;
  agentId?: string | null;
  agentName?: string | null;
  agentContractId?: string | null;
  agentAdvanceId?: string | null;
  powderDeliveryId?: string | null;
  deliveryNumber?: string | null;
  intakeId?: number | null;
  deliveryValueAmd?: number | null;
  outstandingBeforeAmd?: number | null;
  debtRepaymentAmd?: number | null;
  agentPayoutAmd?: number | null;
  outstandingAfterAmd?: number | null;
  source?: "Automatic" | "Manual" | string | null;
  status?: "Success" | "Failed" | string | null;
  errorMessage?: string | null;
  debtRepaymentPercent?: number | null;
  agentPayoutPercent?: number | null;
  createdAt?: string | null;
  createdBy?: string | null;
}

export interface RepaymentListResponse {
  items: RepaymentListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface RepaymentListPayload {
  items?: RepaymentListItemDto[];
  results?: RepaymentListItemDto[];
  totalCount?: number;
  totalItems?: number;
  page?: number;
  pageSize?: number;
}

export interface FailedRepaymentListItemDto {
  powderDeliveryId: string;
  intakeId?: number | null;
  agentId?: string | null;
  agentName?: string | null;
  deliveryNumber?: string | null;
  deliveryValue?: number | null;
  lastAttempt?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  retryCount?: number | null;
  actions?: {
    canRetry?: boolean;
    canManualFix?: boolean;
    needsSupport?: boolean;
  } | null;
}

export interface FailedRepaymentListResponse {
  items: FailedRepaymentListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface FailedRepaymentListPayload {
  items?: FailedRepaymentListItemDto[];
  results?: FailedRepaymentListItemDto[];
  totalCount?: number;
  totalItems?: number;
  page?: number;
  pageSize?: number;
}

export interface RetryFailedRepaymentResponse {
  status?: "Success" | "Failed" | string | null;
  repaymentNumber?: string | null;
  debtRepaymentAmd?: number | null;
  agentPayoutAmd?: number | null;
  outstandingAfterAmd?: number | null;
  errorMessage?: string | null;
}

export interface AutomaticRepaymentDashboardSummaryDto {
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
  successRate: number;
  recentRepayments: Array<{
    date: string;
    count: number;
    successful: number;
    failed: number;
  }>;
  topFailureReasons: Array<{
    errorCode: string;
    errorMessage: string;
    count: number;
  }>;
}

const normalizeRepaymentListResponse = (payload: RepaymentListPayload | null | undefined): RepaymentListResponse => {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.results)
      ? payload.results
      : [];

  return {
    items,
    totalCount: Number(payload?.totalCount ?? payload?.totalItems ?? items.length),
    page: Number(payload?.page ?? 1),
    pageSize: Number(payload?.pageSize ?? (items.length > 0 ? items.length : 20)),
  };
};

const normalizeFailedRepaymentListResponse = (
  payload: FailedRepaymentListPayload | null | undefined,
): FailedRepaymentListResponse => {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.results)
      ? payload.results
      : [];

  return {
    items,
    totalCount: Number(payload?.totalCount ?? payload?.totalItems ?? items.length),
    page: Number(payload?.page ?? 1),
    pageSize: Number(payload?.pageSize ?? (items.length > 0 ? items.length : 20)),
  };
};

export const repaymentsService = {
  listRepayments: async (params?: Record<string, unknown>) => {
    const res = await api.get<RepaymentListPayload>("/repayments", { params });
    return normalizeRepaymentListResponse(res.data);
  },

  getRepayment: async (id: string) => {
    const res = await api.get<RepaymentListItemDto>(`/repayments/${id}`);
    return res.data;
  },

  listFailedRepayments: async (params?: Record<string, unknown>) => {
    const res = await api.get<FailedRepaymentListPayload>("/repayments/failed", { params });
    return normalizeFailedRepaymentListResponse(res.data);
  },

  retryFailedRepayment: async (powderDeliveryId: string, notes?: string) => {
    const res = await api.post<RetryFailedRepaymentResponse>(`/repayments/${powderDeliveryId}/retry`, {
      notes: notes ?? undefined,
    });
    return res.data;
  },

  getAutomaticRepaymentDashboardSummary: async (days = 30) => {
    const res = await api.get<AutomaticRepaymentDashboardSummaryDto>("/repayments/dashboard/automatic-status", {
      params: { days },
    });
    return res.data;
  },
};
