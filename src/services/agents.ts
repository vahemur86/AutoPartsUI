import { api } from "@/services/index";
import type {
  AgentDto,
  AgentTypeDto,
  AgentTypeHistoryDto,
  AgentClassificationRuleDto,
  CreateAgentRequest,
  UpdateAgentRequest,
  PagedResult,
  AgentTypeRequest,
  SaveAgentClassificationRuleRequest,
} from "@/types/agents";

export const agentsService = {
  getAgents: async (params?: Record<string, unknown>) => {
    const res = await api.get<PagedResult<AgentDto>>("/agents", { params });
    return res.data;
  },

  createAgent: async (data: CreateAgentRequest) => {
    const res = await api.post<string>("/agents", data);
    return res.data;
  },

  getAgent: async (id: string) => {
    const res = await api.get<AgentDto>(`/agents/${id}`);
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
