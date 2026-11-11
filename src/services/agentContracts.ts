import { api } from "@/services/index";
import type {
  AddCapitalSourceAllocationRequest,
  AgentAdvanceDto,
  AgentContractDto,
  AgentContractListItemDto,
  CapitalSourceAllocationDto,
  CreateAgentAdvanceRequest,
  AgentAdvanceExtensionDto,
  CreateAgentAdvanceExtensionRequest,
  AgentProductContractSelectionDto,
  ExtendProductCreditDeadlineRequest,
  PagedResult,
  SaveProductCreditTermsRequest,
  SaveAgentContractRequest,
} from "@/types/agentContracts";
import { getCashRegisterId, getHeaders } from "@/utils";

type AgentContractSearchParams = Record<string, unknown> & {
  allowsProductAdvance?: boolean;
};

export const agentContractsService = {
  createContract: async (data: SaveAgentContractRequest) => {
    const response = await api.post<string>("/agent-contracts", data);
    return response.data;
  },

  listContracts: async (params?: Record<string, unknown>) => {
    const response = await api.get<PagedResult<AgentContractListItemDto>>("/agent-contracts", {
      params,
      headers: getHeaders(getCashRegisterId()),
    });
    return response.data;
  },

  listPowderContracts: async (params?: AgentContractSearchParams) => {
    const response = await api.get<PagedResult<AgentContractListItemDto>>("/agent-contracts", {
      params: { ...params, allowsProductAdvance: false },
      headers: getHeaders(getCashRegisterId()),
    });
    return response.data;
  },

  listProductCreditContracts: async (params?: AgentContractSearchParams) => {
    const response = await api.get<PagedResult<AgentContractListItemDto>>("/agent-contracts", {
      params: { ...params, allowsProductAdvance: true },
      headers: getHeaders(getCashRegisterId()),
    });
    return response.data;
  },

  getContract: async (id: string) => {
    const response = await api.get<AgentContractDto>(`/agent-contracts/${id}`);
    return response.data;
  },

  updateContract: async (id: string, data: SaveAgentContractRequest) => {
    await api.put(`/agent-contracts/${id}`, data);
  },

  cancelContract: async (id: string) => {
    await api.post(`/agent-contracts/${id}/cancel`);
  },

  activateProductAdvanceContract: async (id: string) => {
    await api.post(`/agent-contracts/${id}/activate-product`);
  },

  deactivateProductAdvanceContract: async (id: string) => {
    await api.post(`/agent-contracts/${id}/deactivate-product`);
  },

  updateProductCreditTerms: async (id: string, data: SaveProductCreditTermsRequest) => {
    await api.put(`/agent-contracts/${id}/product-credit-terms`, data);
  },

  extendProductCreditDeadline: async (id: string, data: ExtendProductCreditDeadlineRequest) => {
    await api.post(`/agent-contracts/${id}/product-credit-deadline/extensions`, data);
  },

  getShopProductCreditContracts: async (agentId: string, shopId: number, cashRegisterId?: number) => {
    const response = await api.get<AgentProductContractSelectionDto[]>(
      `/agent-contracts/agents/${encodeURIComponent(agentId)}/shops/${shopId}/product-credit`,
      { headers: getHeaders(cashRegisterId ?? getCashRegisterId()) },
    );
    return response.data;
  },

  confirmProductCreditShop: async (contractId: string, shopId: number) => {
    await api.post(`/agent-contracts/${encodeURIComponent(contractId)}/shops/${shopId}/confirm`);
  },

  listContractAdvances: async (id: string) => {
    const response = await api.get<AgentAdvanceDto[]>(`/agent-contracts/${id}/advances`);
    return response.data;
  },

  createAdvance: async (contractId: string, data: CreateAgentAdvanceRequest) => {
    const response = await api.post<string>(`/agent-contracts/${contractId}/advances`, data);
    return response.data;
  },

  listAdvances: async (params?: Record<string, unknown>) => {
    const response = await api.get<PagedResult<AgentAdvanceDto>>("/agent-advances", { params });
    return response.data;
  },

  getAdvance: async (id: string) => {
    const response = await api.get<AgentAdvanceDto>(`/agent-advances/${id}`);
    return response.data;
  },

  getAdvanceExtensions: async (id: string) => {
    const response = await api.get<AgentAdvanceExtensionDto[]>(`/agent-advances/${id}/extensions`);
    return response.data ?? [];
  },

  createAdvanceExtension: async (id: string, data: CreateAgentAdvanceExtensionRequest) => {
    const response = await api.post<AgentAdvanceExtensionDto>(`/agent-advances/${id}/extensions`, data);
    return response.data;
  },

  getAllocations: async (id: string) => {
    const response = await api.get<CapitalSourceAllocationDto[]>(`/agent-advances/${id}/allocations`);
    return response.data;
  },

  addAllocation: async (id: string, data: AddCapitalSourceAllocationRequest) => {
    const response = await api.post<string>(`/agent-advances/${id}/allocations`, data);
    return response.data;
  },

  removeAllocation: async (id: string, allocationId: string) => {
    await api.delete(`/agent-advances/${id}/allocations/${allocationId}`);
  },

  approveAdvance: async (id: string) => {
    await api.post(`/agent-advances/${id}/approve`);
  },
};