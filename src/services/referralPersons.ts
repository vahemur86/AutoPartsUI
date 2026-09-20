import api from "./index";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.util";
import { getCashRegisterId } from "../utils/getCashRegisterId.util";
import { getHeaders } from "../utils/getHeaders.util";

const STORAGE_KEY = "referral-persons";
const RULES_STORAGE_KEY = "referral-person-rules";
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

const parsePagedResponse = <T>(payload: any, fallback: T[] = []): { totalItems: number; page: number; pageSize: number; results: T[] } => {
  if (Array.isArray(payload)) {
    return {
      totalItems: payload.length,
      page: 1,
      pageSize: payload.length,
      results: payload as T[],
    };
  }

  const list = payload?.data ?? payload?.results ?? payload?.items ?? payload?.value ?? fallback;
  const results = Array.isArray(list) ? list : Array.isArray(list?.results) ? list.results :[];
  const totalItems = Number(list?.totalItems ?? list?.totalCount ?? list?.count ?? results.length ?? fallback.length ?? 0);
  const page = Number(list?.page ?? payload?.page ?? 1) || 1;
  const pageSize = Number((list?.pageSize ?? payload?.pageSize ?? results.length ?? fallback.length ?? 10) || 10) || 10;

  return {
    totalItems,
    page,
    pageSize,
    results: results as T[],
  };
};

const normalizeReferralPerson = (value: any): ReferralPersonDto => ({
  id: Number(value?.id ?? value?.referralPersonId ?? 0),
  code: String(value?.code ?? value?.referenceCode ?? ""),
  name: String(value?.name ?? value?.fullName ?? ""),
  phone: value?.phone ?? value?.mobilePhone ?? value?.phoneNumber ?? null,
  email: value?.email ?? null,
  notes: value?.notes ?? value?.description ?? null,
  status: normalizeStatus(value?.status ?? value?.isActive ?? value?.active),
  createdAt: value?.createdAt ?? new Date().toISOString(),
  updatedAt: value?.updatedAt ?? value?.modifiedAt ?? null,
});

const normalizeReferralPersonRule = (value: any): ReferralPersonRuleDto => ({
  id: Number(value?.id ?? value?.ruleId ?? 0),
  personId: Number(value?.referralPersonId ?? value?.personId ?? 0),
  serviceId: Number(value?.serviceId ?? 0),
  serviceName: value?.serviceName ?? null,
  commissionPercent: Number(value?.commissionPercent ?? value?.commission ?? value?.percent ?? 0),
  effectiveFrom: String(value?.effectiveFrom ?? value?.startDate ?? value?.fromDate ?? ""),
  effectiveTo: value?.effectiveTo ?? value?.endDate ?? value?.toDate ?? null,
  notes: value?.notes ?? value?.comment ?? null,
  status: normalizeRuleStatus(value?.status ?? value?.isActive ?? value?.active),
  createdAt: value?.createdAt ?? new Date().toISOString(),
  updatedAt: value?.updatedAt ?? value?.modifiedAt ?? null,
});

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

const readStorage = (): ReferralPersonDto[] => {
  const storage = getStorage();
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeReferralPerson) : [];
  } catch {
    return [];
  }
};

const writeStorage = (items: ReferralPersonDto[]) => {
  getStorage().setItem(STORAGE_KEY, JSON.stringify(items));
};

const readRulesStorage = (): ReferralPersonRuleDto[] => {
  const storage = getStorage();
  const raw = storage.getItem(RULES_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeReferralPersonRule) : [];
  } catch {
    return [];
  }
};

const writeRulesStorage = (items: ReferralPersonRuleDto[]) => {
  getStorage().setItem(RULES_STORAGE_KEY, JSON.stringify(items));
};

const generateId = () => Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`.slice(-12));

const normalizeStatus = (status?: string | number | boolean | null): ReferralPersonStatus => {
  if (typeof status === "number") {
    return status === 1 ? "Inactive" : "Active";
  }
  if (typeof status === "boolean") return status ? "Active" : "Inactive";
  if (status === "Inactive" || status === "inactive") return "Inactive";
  return "Active";
};

const normalizeRuleStatus = (status?: string | number | boolean | null): ReferralRuleStatus => {
  if (typeof status === "number") {
    return status === 1 ? "Inactive" : "Active";
  }
  if (typeof status === "boolean") return status ? "Active" : "Inactive";
  if (status === "Inactive" || status === "inactive") return "Inactive";
  return "Active";
};

const dateValue = (value?: string | null) => (value ? new Date(value).getTime() : null);

const ruleOverlaps = (
  current: Pick<ReferralPersonRuleDto, "effectiveFrom" | "effectiveTo" | "serviceId">,
  candidate: Pick<ReferralPersonRuleDto, "effectiveFrom" | "effectiveTo" | "serviceId">,
) => {
  if (current.serviceId !== candidate.serviceId) return false;

  const startA = dateValue(current.effectiveFrom);
  const endA = dateValue(current.effectiveTo);
  const startB = dateValue(candidate.effectiveFrom);
  const endB = dateValue(candidate.effectiveTo);

  if (startA == null || startB == null) return true;
  const maxStart = Math.max(startA, startB);
  const minEnd = Math.min(endA ?? Number.MAX_SAFE_INTEGER, endB ?? Number.MAX_SAFE_INTEGER);

  return maxStart <= minEnd;
};

export type ReferralPersonStatus = "Active" | "Inactive";
export type ReferralRuleStatus = "Active" | "Inactive";

export interface ReferralPersonDto {
  id: number;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  status: ReferralPersonStatus;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ReferralPersonCreateRequest {
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface ReferralPersonUpdateRequest {
  name?: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface ReferralPersonRuleDto {
  id: number;
  personId: number;
  serviceId: number;
  serviceName?: string | null;
  commissionPercent: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string | null;
  status: ReferralRuleStatus;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ReferralPersonRuleCreateRequest {
  serviceId: number;
  commissionPercent: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string | null;
}

export interface ReferralPersonRuleUpdateRequest {
  serviceId?: number;
  commissionPercent?: number;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  notes?: string | null;
}

export interface ReferralPersonsListResponse {
  totalItems: number;
  page: number;
  pageSize: number;
  results: ReferralPersonDto[];
}

const createReferralPersonLocal = async (
  data: ReferralPersonCreateRequest,
): Promise<ReferralPersonDto> => {
  const items = readStorage();
  const code = data.code.trim();
  const name = data.name.trim();

  if (!code || !name) {
    throw new Error("Code and name are required.");
  }

  if (items.some((item) => item.code.toLowerCase() === code.toLowerCase())) {
    throw new Error("A referral person with this code already exists.");
  }

  const person: ReferralPersonDto = {
    id: generateId(),
    code,
    name,
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    notes: data.notes?.trim() || null,
    status: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  writeStorage([...items, person]);
  return person;
};

const updateReferralPersonLocal = async (
  id: string | number,
  data: ReferralPersonUpdateRequest,
): Promise<ReferralPersonDto> => {
  const items = readStorage();
  const index = items.findIndex((item) => String(item.id) === String(id));

  if (index === -1) throw new Error("Referral person not found.");

  const next = {
    ...items[index],
    ...data,
    name: (data.name ?? items[index].name).trim(),
    phone: data.phone ?? items[index].phone,
    email: data.email ?? items[index].email,
    notes: data.notes ?? items[index].notes,
    status: items[index].status,
    updatedAt: new Date().toISOString(),
  };

  items[index] = next;
  writeStorage(items);
  return next;
};

const getReferralPersonLocal = async (id: string | number): Promise<ReferralPersonDto | null> => {
  const items = readStorage();
  return items.find((item) => String(item.id) === String(id)) ?? null;
};

const deleteReferralPersonLocal = async (id: string | number) => {
  const items = readStorage().filter((item) => String(item.id) !== String(id));
  writeStorage(items);

  const rules = readRulesStorage().filter((rule) => String(rule.personId) !== String(id));
  writeRulesStorage(rules);
  return true;
};

const getReferralPersonRulesLocal = async (personId: string | number): Promise<ReferralPersonRuleDto[]> => {
  const rules = readRulesStorage();
  return rules.filter((rule) => String(rule.personId) === String(personId));
};

export const getReferralPersons = async (
  params?: Record<string, unknown>,
): Promise<ReferralPersonsListResponse> => {
  try {
    const includeInactive = params?.status === "Inactive" || params?.status === "All";
    const cashRegisterId = Number(params?.cashRegisterId) || getCashRegisterId();
    const response = await api.get("/referral-persons", {
      params: { includeInactive },
      headers: getHeaders(cashRegisterId),
    });
    const payload = parsePagedResponse<ReferralPersonDto>(response.data);
    const search = String(params?.search ?? "").trim().toLowerCase();
    const status = params?.status ? String(params.status) : "";
    const filtered = payload.results.filter((item) => {
      const matchesStatus = !status || status === "All" || item.status === normalizeStatus(status);
      const haystack = `${item.code} ${item.name} ${item.phone ?? ""} ${item.email ?? ""}`.toLowerCase();
      return matchesStatus && (!search || haystack.includes(search));
    });
    const page = Number(params?.page ?? 1) || 1;
    const pageSize = Number(params?.pageSize ?? 10) || 10;
    return {
      totalItems: filtered.length,
      page,
      pageSize,
      results: filtered.slice((page - 1) * pageSize, page * pageSize),
    };
  } catch (error) {
    if (!fallbackToLocal(error)) {
      throw new Error(getApiErrorMessage(error, "Failed to get referral persons."));
    }

    const items = readStorage();
    const page = Number(params?.page ?? 1) || 1;
    const pageSize = Number(params?.pageSize ?? 10) || 10;
    const search = String(params?.search ?? "").trim().toLowerCase();
    const status = params?.status ? String(params.status) : "";

    let filtered = [...items];
    if (status) filtered = filtered.filter((item) => item.status === normalizeStatus(status));
    if (search) {
      filtered = filtered.filter((item) => {
        const haystack = `${item.code} ${item.name} ${item.phone ?? ""} ${item.email ?? ""}`.toLowerCase();
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

export const createReferralPerson = async (
  data: ReferralPersonCreateRequest,
): Promise<ReferralPersonDto> => {
  try {
    const response = await api.post("/referral-persons", data);
    return normalizeReferralPerson(response.data?.data ?? response.data?.result ?? response.data);
  } catch (error) {
    if (fallbackToLocal(error)) {
      return createReferralPersonLocal(data);
    }
    throw new Error(getApiErrorMessage(error, "Failed to create referral person."));
  }
};

export const updateReferralPerson = async (
  id: string | number,
  data: ReferralPersonUpdateRequest,
): Promise<ReferralPersonDto> => {
  try {
    const response = await api.put(`/referral-persons/${id}`, data);
    return normalizeReferralPerson(response.data?.data ?? response.data?.result ?? response.data);
  } catch (error) {
    if (fallbackToLocal(error)) {
      return updateReferralPersonLocal(id, data);
    }
    throw new Error(getApiErrorMessage(error, "Failed to update referral person."));
  }
};

export const getReferralPerson = async (
  id: string | number,
): Promise<ReferralPersonDto | null> => {
  try {
    const response = await api.get(`/referral-persons/${id}`);
    const payload = response.data?.data ?? response.data?.result ?? response.data;
    return payload ? normalizeReferralPerson(payload) : null;
  } catch (error) {
    if (fallbackToLocal(error)) {
      return getReferralPersonLocal(id);
    }
    throw new Error(getApiErrorMessage(error, "Failed to get referral person."));
  }
};

export const deleteReferralPerson = async (id: string | number) => {
  try {
    await api.delete(`/referral-persons/${id}`);
    return true;
  } catch (error) {
    if (fallbackToLocal(error)) {
      return deleteReferralPersonLocal(id);
    }
    throw new Error(getApiErrorMessage(error, "Failed to delete referral person."));
  }
};

export const getReferralPersonRules = async (
  personId: string | number,
): Promise<ReferralPersonRuleDto[]> => {
  try {
    const response = await api.get(`/referral-persons/${personId}/commission-rules`);
    const payload = response.data?.data ?? response.data?.result ?? response.data;
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : [];
    return items.map(normalizeReferralPersonRule);
  } catch (error) {
    if (fallbackToLocal(error)) {
      return getReferralPersonRulesLocal(personId);
    }
    throw new Error(getApiErrorMessage(error, "Failed to get referral person rules."));
  }
};

const createReferralPersonRuleLocal = async (
  personId: string | number,
  data: ReferralPersonRuleCreateRequest,
): Promise<ReferralPersonRuleDto> => {
  const person = await getReferralPersonLocal(personId);
  if (!person) throw new Error("Referral person not found.");

  const serviceId = Number(data.serviceId);
  const commissionPercent = Number(data.commissionPercent);
  const effectiveFrom = data.effectiveFrom?.trim();

  if (!serviceId) throw new Error("Service is required.");
  if (Number.isNaN(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
    throw new Error("Commission percentage must be between 0 and 100.");
  }
  if (!effectiveFrom) throw new Error("Effective from date is required.");

  const rules = readRulesStorage();
  const candidate: ReferralPersonRuleDto = {
    id: generateId(),
    personId: Number(personId),
    serviceId,
    serviceName: null,
    commissionPercent,
    effectiveFrom,
    effectiveTo: data.effectiveTo ?? null,
    notes: data.notes?.trim() ?? null,
    status: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const overlaps = rules.filter((rule) => {
    if (String(rule.personId) !== String(personId)) return false;
    if (rule.status !== "Active") return false;
    return ruleOverlaps(rule, candidate);
  });

  if (overlaps.length > 0) {
    throw new Error(`Active rule exists for service ${serviceId} in the selected period.`);
  }

  rules.push(candidate);
  writeRulesStorage(rules);
  return candidate;
};

const updateReferralPersonRuleLocal = async (
  personId: string | number,
  ruleId: string | number,
  data: ReferralPersonRuleUpdateRequest,
): Promise<ReferralPersonRuleDto> => {
  const items = readRulesStorage();
  const index = items.findIndex(
    (rule) => String(rule.personId) === String(personId) && String(rule.id) === String(ruleId),
  );

  if (index === -1) throw new Error("Commission rule not found.");

  const next = {
    ...items[index],
    ...data,
    serviceId: Number(data.serviceId ?? items[index].serviceId),
    commissionPercent: Number(data.commissionPercent ?? items[index].commissionPercent),
    effectiveFrom: data.effectiveFrom ?? items[index].effectiveFrom,
    effectiveTo: data.effectiveTo ?? items[index].effectiveTo,
    notes: data.notes ?? items[index].notes,
    status: items[index].status,
    updatedAt: new Date().toISOString(),
  };

  if (next.commissionPercent < 0 || next.commissionPercent > 100) {
    throw new Error("Commission percentage must be between 0 and 100.");
  }

  if (!next.serviceId) throw new Error("Service is required.");
  if (!next.effectiveFrom) throw new Error("Effective from date is required.");
  if (next.effectiveTo && new Date(next.effectiveTo) < new Date(next.effectiveFrom)) {
    throw new Error("Effective to date cannot be earlier than effective from date.");
  }

  const overlaps = items.filter((rule) => {
    if (String(rule.personId) !== String(personId)) return false;
    if (String(rule.id) === String(ruleId)) return false;
    if (rule.status !== "Active") return false;
    return ruleOverlaps(rule, next);
  });

  if (overlaps.length > 0) {
    throw new Error(`Active rule exists for service ${next.serviceId} in the selected period.`);
  }

  items[index] = next;
  writeRulesStorage(items);
  return next;
};

const toggleReferralPersonRuleStatusLocal = async (
  personId: string | number,
  ruleId: string | number,
  nextStatus?: ReferralRuleStatus,
) => {
  const items = readRulesStorage();
  const index = items.findIndex(
    (rule) => String(rule.personId) === String(personId) && String(rule.id) === String(ruleId),
  );

  if (index === -1) throw new Error("Commission rule not found.");

  const status = normalizeRuleStatus(nextStatus ?? (items[index].status === "Active" ? "Inactive" : "Active"));
  items[index] = {
    ...items[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  writeRulesStorage(items);
  return items[index];
};

export const createReferralPersonRule = async (
  personId: string | number,
  data: ReferralPersonRuleCreateRequest,
): Promise<ReferralPersonRuleDto> => {
  try {
    const response = await api.post(`/referral-persons/${personId}/commission-rules`, data);
    return normalizeReferralPersonRule(response.data?.data ?? response.data?.result ?? response.data);
  } catch (error) {
    if (fallbackToLocal(error)) {
      return createReferralPersonRuleLocal(personId, data);
    }
    throw new Error(getApiErrorMessage(error, "Failed to create commission rule."));
  }
};

export const updateReferralPersonRule = async (
  personId: string | number,
  ruleId: string | number,
  data: ReferralPersonRuleUpdateRequest,
): Promise<ReferralPersonRuleDto> => {
  try {
    const response = await api.put(`/referral-persons/${personId}/commission-rules/${ruleId}`, data);
    return normalizeReferralPersonRule(response.data?.data ?? response.data?.result ?? response.data);
  } catch (error) {
    if (fallbackToLocal(error)) {
      return updateReferralPersonRuleLocal(personId, ruleId, data);
    }
    throw new Error(getApiErrorMessage(error, "Failed to update commission rule."));
  }
};

export const toggleReferralPersonRuleStatus = async (
  personId: string | number,
  ruleId: string | number,
  nextStatus?: ReferralRuleStatus,
) => {
  try {
    const action = nextStatus === "Inactive" ? "deactivate" : "activate";
    await api.post(`/referral-persons/${personId}/commission-rules/${ruleId}/${action}`);
    return getReferralPersonRules(personId).then((items) => items.find((item) => String(item.id) === String(ruleId)) ?? null);
  } catch (error) {
    if (fallbackToLocal(error)) {
      return toggleReferralPersonRuleStatusLocal(personId, ruleId, nextStatus);
    }
    throw new Error(getApiErrorMessage(error, "Failed to update commission rule status."));
  }
};

export const activateReferralPerson = async (id: string | number) => {
  try {
    await api.post(`/referral-persons/${id}/activate`);
  } catch (error) {
    if (!fallbackToLocal(error)) {
      throw new Error(getApiErrorMessage(error, "Failed to activate referral person."));
    }
    const items = readStorage();
    const index = items.findIndex((item) => String(item.id) === String(id));
    if (index === -1) throw new Error("Referral person not found.");
    items[index] = { ...items[index], status: "Active", updatedAt: new Date().toISOString() };
    writeStorage(items);
  }
};

export const deactivateReferralPerson = async (id: string | number) => {
  try {
    await api.post(`/referral-persons/${id}/deactivate`);
  } catch (error) {
    if (!fallbackToLocal(error)) {
      throw new Error(getApiErrorMessage(error, "Failed to deactivate referral person."));
    }
    const items = readStorage();
    const index = items.findIndex((item) => String(item.id) === String(id));
    if (index === -1) throw new Error("Referral person not found.");
    items[index] = { ...items[index], status: "Inactive", updatedAt: new Date().toISOString() };
    writeStorage(items);
  }
};
