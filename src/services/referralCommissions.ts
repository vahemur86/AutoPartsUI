import api from "./index";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.util";

const STORAGE_KEY = "referral-commissions";
const memoryStorage = new Map<string, string>();

const getStorage = (): Storage => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return {
    getItem: (key: string) => (memoryStorage.has(key) ? memoryStorage.get(key)! : null),
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    },
    clear: () => {
      memoryStorage.clear();
    },
    key: (index: number) => Array.from(memoryStorage.keys())[index] ?? null,
    length: memoryStorage.size,
  } as Storage;
};

const fallbackToLocal = (error: unknown) => {
  if (typeof window === "undefined") return true;

  const axiosError = error as {
    response?: { status?: number };
    code?: string;
    message?: string;
  };

  const status = axiosError?.response?.status;
  const message = String(axiosError?.message ?? "");

  return (
    status === 404 ||
    status === 405 ||
    status === 501 ||
    status === 0 ||
    axiosError?.code === "ERR_NETWORK" ||
    message.includes("Network Error") ||
    message.includes("fetch failed") ||
    message.includes("ECONNREFUSED") ||
    message.includes("Failed to fetch")
  );
};

const normalizeReferralCommission = (value: any): ReferralCommissionDto => ({
  id: Number(value?.id ?? value?.commissionId ?? 0),
  serviceOrderId: Number(value?.serviceOrderId ?? value?.orderId ?? 0),
  referralPersonId: Number(value?.referralPersonId ?? value?.personId ?? 0),
  referralPersonName: String(value?.referralPersonName ?? value?.name ?? value?.fullName ?? ""),
  serviceId: Number(value?.serviceId ?? 0),
  serviceName: String(value?.serviceName ?? value?.service ?? value?.category ?? ""),
  servicePrice: Number(value?.servicePrice ?? value?.amount ?? value?.total ?? 0),
  commissionPercent: Number(value?.commissionPercent ?? value?.percent ?? 0),
  commissionAmount: Number(value?.commissionAmount ?? value?.commission ?? 0),
  status: normalizeCommissionStatus(value?.status ?? value?.state),
  createdAt: value?.createdAt ?? new Date().toISOString(),
  approvedAt: value?.approvedAt ?? value?.approvedDate ?? null,
  paidAt: value?.paidAt ?? value?.paidDate ?? null,
  rejectedAt: value?.rejectedAt ?? value?.rejectedDate ?? null,
  notes: value?.notes ?? value?.comment ?? null,
  approvedByUsername: value?.approvedByUsername ?? null,
  rejectedByUsername: value?.rejectedByUsername ?? null,
  paidByUsername: value?.paidByUsername ?? null,
});

const normalizeCommissionStatus = (status?: string | null): ReferralCommissionStatus => {
  switch (status) {
    case "Approved":
    case "approved":
      return "Approved";
    case "Paid":
    case "paid":
      return "Paid";
    case "Rejected":
    case "rejected":
      return "Rejected";
    case "Cancelled":
    case "cancelled":
    case "Canceled":
    case "canceled":
      return "Cancelled";
    default:
      return "Pending";
  }
};

export type ReferralCommissionStatus =
  | "Pending"
  | "Approved"
  | "Paid"
  | "Rejected"
  | "Cancelled";

export interface ReferralCommissionDto {
  id: number;
  serviceOrderId: number;
  referralPersonId: number;
  referralPersonName: string;
  serviceId: number;
  serviceName: string;
  servicePrice: number;
  commissionPercent: number;
  commissionAmount: number;
  status: ReferralCommissionStatus;
  createdAt: string;
  approvedAt?: string | null;
  approvedByUsername?: string | null;
  paidAt?: string | null;
  paidByUsername?: string | null;
  rejectedAt?: string | null;
  rejectedByUsername?: string | null;
  notes?: string | null;
}

export interface ReferralCommissionListResponse {
  totalItems: number;
  page: number;
  pageSize: number;
  results: ReferralCommissionDto[];
}

const seedCommissions = (): ReferralCommissionDto[] => [
  {
    id: 1024,
    serviceOrderId: 1024,
    referralPersonId: 1,
    serviceId: 10,
    referralPersonName: "Aram Sargsyan",
    serviceName: "Oil Change",
    servicePrice: 65,
    commissionPercent: 10,
    commissionAmount: 6.5,
    status: "Pending",
    createdAt: "2026-01-15T10:30:00.000Z",
    notes: "Promotional commission",
  },
  {
    id: 1025,
    serviceOrderId: 1025,
    referralPersonId: 2,
    serviceId: 11,
    referralPersonName: "Mark Davtyan",
    serviceName: "Brake Repair",
    servicePrice: 150,
    commissionPercent: 7,
    commissionAmount: 10.5,
    status: "Approved",
    createdAt: "2026-01-16T09:00:00.000Z",
    approvedAt: "2026-01-17T08:30:00.000Z",
  },
  {
    id: 1026,
    serviceOrderId: 1026,
    referralPersonId: 1,
    serviceId: 12,
    referralPersonName: "Aram Sargsyan",
    serviceName: "Transmission",
    servicePrice: 280,
    commissionPercent: 5,
    commissionAmount: 14,
    status: "Paid",
    createdAt: "2026-01-12T12:00:00.000Z",
    approvedAt: "2026-01-13T08:00:00.000Z",
    paidAt: "2026-01-20T09:00:00.000Z",
  },
  {
    id: 1027,
    serviceOrderId: 1027,
    referralPersonId: 3,
    serviceId: 13,
    referralPersonName: "Lisa Silva",
    serviceName: "Engine Service",
    servicePrice: 420,
    commissionPercent: 8,
    commissionAmount: 33.6,
    status: "Rejected",
    createdAt: "2026-01-18T11:00:00.000Z",
    rejectedAt: "2026-01-19T13:00:00.000Z",
  },
];

const readStorage = (): ReferralCommissionDto[] => {
  const storage = getStorage();
  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    storage.setItem(STORAGE_KEY, JSON.stringify(seedCommissions()));
    return seedCommissions();
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeReferralCommission) : seedCommissions();
  } catch {
    return seedCommissions();
  }
};

const writeStorage = (items: ReferralCommissionDto[]) => {
  getStorage().setItem(STORAGE_KEY, JSON.stringify(items));
};

const parseCommissionList = (payload: any) => {
  if (Array.isArray(payload)) {
    return {
      totalItems: payload.length,
      page: 1,
      pageSize: payload.length,
      results: payload.map(normalizeReferralCommission),
    };
  }

  const source = payload?.data ?? payload?.results ?? payload?.items ?? payload?.value ?? payload;
  const results = Array.isArray(source) ? source : Array.isArray(source?.results) ? source.results : [];
  const totalItems = Number(source?.totalItems ?? source?.totalCount ?? source?.count ?? results.length ?? 0);
  return {
    totalItems,
    page: Number(source?.page ?? payload?.page ?? 1) || 1,
    pageSize: Number((source?.pageSize ?? payload?.pageSize ?? results.length ?? 10) || 10) || 10,
    results: results.map(normalizeReferralCommission),
  };
};

export const getReferralCommissions = async (
  params?: Record<string, unknown>,
): Promise<ReferralCommissionListResponse> => {
  try {
    const page = Number(params?.page ?? 1) || 1;
    const take = Number(params?.pageSize ?? 10) || 10;
    const status = params?.status === "All" ? undefined : params?.status;
    const response = await api.post("/referral-commissions/filter", {
      referralPersonId: params?.referralPersonId ?? null,
      serviceId: params?.serviceId ?? null,
      serviceOrderId: params?.serviceOrderId ?? null,
      status: status ?? null,
      dateFrom: params?.dateFrom ?? null,
      dateTo: params?.dateTo ?? null,
      skip: (page - 1) * take,
      take,
    });
    const parsed = parseCommissionList(response.data);
    return {
      totalItems: parsed.totalItems,
      page: parsed.page,
      pageSize: parsed.pageSize,
      results: parsed.results,
    };
  } catch (error) {
    if (!fallbackToLocal(error)) {
      throw new Error(getApiErrorMessage(error, "Failed to get referral commissions."));
    }

    const items = readStorage();
    const page = Number(params?.page ?? 1) || 1;
    const pageSize = Number(params?.pageSize ?? 10) || 10;
    const status = params?.status ? String(params.status) : "All";
    const search = String(params?.search ?? "").trim().toLowerCase();

    let filtered = [...items];
    if (status !== "All") filtered = filtered.filter((item) => item.status === status);
    if (search) {
      filtered = filtered.filter((item) => {
        const haystack = `${item.referralPersonName} ${item.serviceName} ${item.serviceOrderId}`.toLowerCase();
        return haystack.includes(search);
      });
    }

    const start = (page - 1) * pageSize;
    return {
      totalItems: filtered.length,
      page,
      pageSize,
      results: filtered.slice(start, start + pageSize),
    };
  }
};

export const getReferralCommission = async (id: string | number) => {
  try {
    const response = await api.get(`/referral-commissions/${id}`);
    return normalizeReferralCommission(response.data?.data ?? response.data?.result ?? response.data ?? null);
  } catch (error) {
    if (fallbackToLocal(error)) {
      return readStorage().find((item) => String(item.id) === String(id)) ?? null;
    }
    throw new Error(getApiErrorMessage(error, "Failed to get referral commission."));
  }
};

export const getReferralCommissionByServiceOrder = async (serviceOrderId: string | number) => {
  try {
    const response = await api.get(`/referral-commissions/by-service-order/${serviceOrderId}`);
    const payload = response.data?.data ?? response.data?.result ?? response.data;
    return payload ? normalizeReferralCommission(payload) : null;
  } catch (error) {
    if (fallbackToLocal(error)) {
      return readStorage().find((item) => String(item.serviceOrderId) === String(serviceOrderId)) ?? null;
    }
    throw new Error(getApiErrorMessage(error, "Failed to get commission by service order."));
  }
};

export const approveReferralCommission = async (
  id: string | number,
  notes?: string,
) => {
  try {
    await api.post(`/referral-commissions/${id}/approve`, { notes });
    return;
  } catch (error) {
    if (fallbackToLocal(error)) {
      const items = readStorage();
      const index = items.findIndex((item) => String(item.id) === String(id));
      if (index === -1) throw new Error("Commission not found.");
      if (["Paid", "Rejected", "Cancelled"].includes(items[index].status)) {
        throw new Error("This commission cannot be approved in its current status.");
      }
      items[index] = { ...items[index], status: "Approved", notes: notes ?? items[index].notes ?? null, approvedAt: new Date().toISOString() };
      writeStorage(items);
      return items[index];
    }
    throw new Error(getApiErrorMessage(error, "Failed to approve referral commission."));
  }
};

export const rejectReferralCommission = async (
  id: string | number,
  reason: string,
) => {
  try {
    await api.post(`/referral-commissions/${id}/reject`, { reason });
    return;
  } catch (error) {
    if (fallbackToLocal(error)) {
      const items = readStorage();
      const index = items.findIndex((item) => String(item.id) === String(id));
      if (index === -1) throw new Error("Commission not found.");
      if (!reason?.trim()) throw new Error("A rejection reason is required.");
      items[index] = { ...items[index], status: "Rejected", notes: reason.trim(), rejectedAt: new Date().toISOString() };
      writeStorage(items);
      return items[index];
    }
    throw new Error(getApiErrorMessage(error, "Failed to reject referral commission."));
  }
};

export const payReferralCommission = async (
  id: string | number,
  payload: { reference?: string },
) => {
  try {
    await api.post(`/referral-commissions/${id}/pay`, payload);
    return;
  } catch (error) {
    if (fallbackToLocal(error)) {
      const items = readStorage();
      const index = items.findIndex((item) => String(item.id) === String(id));
      if (index === -1) throw new Error("Commission not found.");
      if (!payload.reference?.trim()) throw new Error("Payment reference is required.");
      items[index] = {
        ...items[index],
        status: "Paid",
        notes: items[index].notes ?? null,
        paidAt: new Date().toISOString(),
      };
      writeStorage(items);
      return items[index];
    }
    throw new Error(getApiErrorMessage(error, "Failed to pay referral commission."));
  }
};

