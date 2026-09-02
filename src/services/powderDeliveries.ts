import { api } from "@/services";
import type { CreatePowderDeliveryRequest, PagedPowderDeliveries, PowderDeliveryDto } from "@/types/powderDeliveries";

export const powderDeliveriesService = {
  create: async (data: CreatePowderDeliveryRequest) => {
    const response = await api.post<string>("/powder-deliveries", data);
    return response.data;
  },
  list: async (params?: Record<string, unknown>) => {
    const response = await api.get<PagedPowderDeliveries>("/powder-deliveries", { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get<PowderDeliveryDto>(`/powder-deliveries/${id}`);
    return response.data;
  },
  valuate: async (id: string) => { await api.post(`/powder-deliveries/${id}/valuate`); },
  confirm: async (id: string) => { await api.post(`/powder-deliveries/${id}/confirm`); },
  cancel: async (id: string) => { await api.post(`/powder-deliveries/${id}/cancel`); },
  listForAgent: async (agentId: string, params?: Record<string, unknown>) => {
    const response = await api.get<PagedPowderDeliveries>(`/agents/${agentId}/powder-deliveries`, { params });
    return response.data;
  },
  listForContract: async (contractId: string, params?: Record<string, unknown>) => {
    const response = await api.get<PagedPowderDeliveries>(`/agent-contracts/${contractId}/powder-deliveries`, { params });
    return response.data;
  },
};