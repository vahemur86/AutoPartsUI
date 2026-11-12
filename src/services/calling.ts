import { api } from "@/services/index";
import type {
  CallAcceptedResponse,
  CallCreatedResponse,
  CallDetails,
  CallHistoryPage,
  IceServerResponse,
} from "@/types/calling";

export const callingService = {
  startCall: async () => {
    const response = await api.post<CallCreatedResponse>("/calls");
    return response.data;
  },

  acceptCall: async (callId: string) => {
    const response = await api.post<CallAcceptedResponse>(
      `/calls/${encodeURIComponent(callId)}/accept`,
    );
    return response.data;
  },

  rejectCall: async (callId: string) => {
    await api.post(`/calls/${encodeURIComponent(callId)}/reject`);
  },

  endCall: async (callId: string) => {
    await api.post(`/calls/${encodeURIComponent(callId)}/end`);
  },

  getCall: async (callId: string) => {
    const response = await api.get<CallDetails>(
      `/calls/${encodeURIComponent(callId)}`,
    );
    return response.data;
  },

  getHistory: async (page = 1, pageSize = 50) => {
    const response = await api.get<CallHistoryPage>("/calls/history", {
      params: { page, pageSize },
    });
    return response.data;
  },

  getIceServers: async () => {
    const response = await api.get<IceServerResponse>("/calls/ice-servers");
    return response.data;
  },
};
