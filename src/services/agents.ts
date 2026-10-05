import { api } from "@/services/index";
import type {
  AgentProductDebtDto,
  AgentProductDebtPaymentDto,
  CreateAgentProductDebtPaymentRequest,
  AgentDto,
  AgentTypeDto,
  AgentTypeHistoryDto,
  AgentClassificationRuleDto,
  CreateAgentRequest,
  UpdateAgentRequest,
  PagedResult,
  AgentTypeRequest,
  SaveAgentClassificationRuleRequest,
  AgentFinancialSummaryDto,
} from "@/types/agents";
import { getHeaders } from "@/utils";

interface AgentFinancialSummaryFlatDto {
  agentId?: string | null;
  agentCode?: string | null;
  agentFullName?: string | null;
  activeContractsCount?: number | null;
  totalAdvancedAmount?: number | null;
  totalRepaidAmount?: number | null;
  totalOutstandingAmount?: number | null;
  contracts?: Array<{
    contractId?: string | null;
    contractNumber?: string | null;
    status?: string | null;
    totalAdvancedAmount?: number | null;
    totalRepaidAmount?: number | null;
    outstandingAmount?: number | null;
    activeAdvancesCount?: number | null;
  }> | null;
  lastRepaymentsDate?: string | null;
  recentRepaymentCount?: number | null;
}

export const normalizeAgentFinancialSummary = (
  data: AgentFinancialSummaryDto | AgentFinancialSummaryFlatDto | null | undefined,
): AgentFinancialSummaryDto => {
  if (!data) {
    return {
      agent: {
        id: "",
        name: "",
        code: "",
        status: "Unknown",
        totalAdvancedAmount: 0,
        totalRepaidAmount: 0,
        outstandingAmount: 0,
      },
      contract: {
        id: "",
        number: "",
        status: "Unknown",
      },
      advances: [],
      recentDeliveries: [],
      recentRepayments: [],
    };
  }

  if ("agent" in data && data.agent) {
    return data as AgentFinancialSummaryDto;
  }

  const flatData = data as AgentFinancialSummaryFlatDto;
  const firstContract = Array.isArray(flatData.contracts) ? flatData.contracts[0] : undefined;
  const totalAdvancedAmount = Number(flatData.totalAdvancedAmount ?? firstContract?.totalAdvancedAmount ?? 0) || 0;
  const totalRepaidAmount = Number(flatData.totalRepaidAmount ?? firstContract?.totalRepaidAmount ?? 0) || 0;
  const totalOutstandingAmount = Number(flatData.totalOutstandingAmount ?? firstContract?.outstandingAmount ?? 0) || 0;

  return {
    agent: {
      id: flatData.agentId ?? "",
      name: flatData.agentFullName ?? "",
      code: flatData.agentCode ?? "",
      status: firstContract?.status ?? "Active",
      totalAdvancedAmount,
      totalRepaidAmount,
      outstandingAmount: totalOutstandingAmount,
    },
    contract: {
      id: firstContract?.contractId ?? "",
      number: firstContract?.contractNumber ?? "",
      status: firstContract?.status ?? "Active",
      defaultRepaymentPeriodDays: undefined,
      maximumExtensions: undefined,
      debtRepaymentPercent: undefined,
      agentPayoutPercent: undefined,
      excessBusinessPercent: undefined,
      excessAgentPercent: undefined,
      effectiveDate: undefined,
    },
    advances: [],
    recentDeliveries: [],
    recentRepayments: [],
  };
};

export const agentsService = {
  getAgents: async (params?: Record<string, unknown>) => {
    const res = await api.get<PagedResult<AgentDto>>("/agents", { params });
    return res.data;
  },

  createAgent: async (data: CreateAgentRequest) => {
    const res = await api.post<string | { id?: string; agentId?: string }>("/agents", data);
    if (typeof res.data === "string") return res.data;

    const createdId = res.data.id ?? res.data.agentId;
    if (!createdId) throw new Error("The create agent response did not include an agent ID.");
    return createdId;
  },

  getAgent: async (id: string) => {
    const res = await api.get<AgentDto>(`/agents/${id}`);
    return res.data;
  },

  getAgentFinancialSummary: async (id: string) => {
    const res = await api.get<AgentFinancialSummaryDto | AgentFinancialSummaryFlatDto>(`/agents/${id}/financial-summary`);
    return normalizeAgentFinancialSummary(res.data);
  },

  getProductDebt: async (id: string, contractId?: string, cashRegisterId?: number) => {
    const res = await api.get<AgentProductDebtDto>(`/agents/${id}/product-debt`, {
      params: contractId ? { contractId } : undefined,
      headers: getHeaders(cashRegisterId),
    });
    return res.data;
  },

  getProductDebtPayments: async (id: string, contractId?: string, cashRegisterId?: number) => {
    const res = await api.get<AgentProductDebtPaymentDto[]>(
      `/agents/${id}/product-debt/payments`,
      {
        params: contractId ? { contractId } : undefined,
        headers: getHeaders(cashRegisterId),
      },
    );
    return res.data;
  },

  createProductDebtPayment: async (
    id: string,
    data: CreateAgentProductDebtPaymentRequest,
    cashRegisterId: number,
  ) => {
    const res = await api.post<AgentProductDebtPaymentDto>(
      `/agents/${id}/product-debt/payments`,
      data,
      { headers: getHeaders(cashRegisterId) },
    );
    return res.data;
  },

  updateAgent: async (id: string, data: UpdateAgentRequest) => {
    const res = await api.put(`/agents/${id}`, data);
    return res.data;
  },

  activateAgent: async (id: string) => {
    const res = await api.post(`/agents/${id}/activate`);
    return res.data;
  },

  deactivateAgent: async (id: string) => {
    const res = await api.post(`/agents/${id}/deactivate`);
    return res.data;
  },

  suspendAgent: async (id: string) => {
    const res = await api.post(`/agents/${id}/suspend`);
    return res.data;
  },

  blockAgent: async (id: string) => {
    const res = await api.post(`/agents/${id}/block`);
    return res.data;
  },

  getAgentTypeHistory: async (id: string) => {
    const res = await api.get<AgentTypeHistoryDto[]>(`/agents/${id}/type-history`);
    return res.data;
  },

  classifyAgent: async (id: string) => {
    const res = await api.post<AgentTypeDto>(`/agents/${id}/classify`);
    return res.data;
  },

  getAgentTypes: async () => {
    const res = await api.get<AgentTypeDto[]>("/agent-types");
    return res.data;
  },

  getAgentType: async (id: string) => {
    const res = await api.get<AgentTypeDto>(`/agent-types/${id}`);
    return res.data;
  },

  createAgentType: async (data: AgentTypeRequest) => {
    const res = await api.post<string>("/agent-types", data);
    return res.data;
  },

  updateAgentType: async (id: string, data: AgentTypeRequest) => {
    const res = await api.put(`/agent-types/${id}`, data);
    return res.data;
  },

  activateAgentType: async (id: string) => {
    const res = await api.post(`/agent-types/${id}/activate`);
    return res.data;
  },

  deactivateAgentType: async (id: string) => {
    const res = await api.post(`/agent-types/${id}/deactivate`);
    return res.data;
  },

  getClassificationRules: async (params?: Record<string, unknown>) => {
    const res = await api.get<AgentClassificationRuleDto[]>("/agent-classification-rules", { params });
    return res.data;
  },

  createClassificationRule: async (data: SaveAgentClassificationRuleRequest) => {
    const res = await api.post<string>("/agent-classification-rules", data);
    return res.data;
  },

  updateClassificationRule: async (id: string, data: SaveAgentClassificationRuleRequest) => {
    const res = await api.put(`/agent-classification-rules/${id}`, data);
    return res.data;
  },

  activateClassificationRule: async (id: string) => {
    const res = await api.post(`/agent-classification-rules/${id}/activate`);
    return res.data;
  },

  deactivateClassificationRule: async (id: string) => {
    const res = await api.post(`/agent-classification-rules/${id}/deactivate`);
    return res.data;
  },

  getClassificationRule: async (id: string) => {
    const res = await api.get<AgentClassificationRuleDto>(`/agent-classification-rules/${id}`);
    return res.data;
  },
};
