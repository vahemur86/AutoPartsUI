import api from "@/services/index";
import type {
  CapitalSourceDto,
  CapitalSourceMoneyRequest,
  CapitalSourceTransactionDto,
  CreateCapitalSourceRequest,
  PagedCapitalSources,
  UpdateCapitalSourceRequest,
} from "@/types/capitalSources";

export const capitalSourcesService = {
  listCapitalSources: async (params?: Record<string, unknown>) => {
    const response = await api.get<PagedCapitalSources>("/capital-sources", {
      params,
    });
    return response.data;
  },

  getCapitalSource: async (id: string) => {
    const response = await api.get<CapitalSourceDto>(`/capital-sources/${id}`);
    return response.data;
  },

  createCapitalSource: async (data: CreateCapitalSourceRequest) => {
    const response = await api.post<string>("/capital-sources", data);
    return response.data;
  },

  updateCapitalSource: async (id: string, data: UpdateCapitalSourceRequest) => {
    const response = await api.put(`/capital-sources/${id}`, data);
    return response.data;
  },

  activateCapitalSource: async (id: string) => {
    await api.post(`/capital-sources/${id}/activate`);
  },

  deactivateCapitalSource: async (id: string) => {
    await api.post(`/capital-sources/${id}/deactivate`);
  },

  closeCapitalSource: async (id: string) => {
    await api.post(`/capital-sources/${id}/close`);
  },

  receiveMoney: async (id: string, data: CapitalSourceMoneyRequest) => {
    await api.post(`/capital-sources/${id}/receive`, data);
  },

  returnMoney: async (id: string, data: CapitalSourceMoneyRequest) => {
    await api.post(`/capital-sources/${id}/return`, data);
  },

  getTransactionHistory: async (id: string) => {
    const response = await api.get<CapitalSourceTransactionDto[]>(`/capital-sources/${id}/transactions`);
    return response.data;
  },
};
