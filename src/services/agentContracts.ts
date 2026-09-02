import { api } from "@/services/index";
import type {
  AddCapitalSourceAllocationRequest,
  AgentAdvanceDto,
  AgentContractDto,
  AgentContractListItemDto,
  CapitalSourceAllocationDto,
  CreateAgentAdvanceRequest,
  PagedResult,
  SaveAgentContractRequest,
} from "@/types/agentContracts";

export const agentContractsService = {
  createContract: async (data: SaveAgentContractRequest) => {
    const response = await api.post<string>("/agent-contracts", data);
    return response.data;
  },

  listContracts: async (params?: Record<string, unknown>) => {
    const response = await api.get<PagedResult<AgentContractListItemDto>>("/agent-contracts", { params });
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

  activateAdvance: async (id: string) => {
    await api.post(`/agent-advances/${id}/activate`);
  },
};