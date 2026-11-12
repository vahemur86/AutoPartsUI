import { api } from "@/services/index";
import { getCashRegisterId, getHeaders } from "@/utils";
import type {
  CallAcceptedResponse,
  CallCreatedResponse,
  CallDetails,
  CallHistoryPage,
  IceServerResponse,
} from "@/types/calling";

const getRequestConfig = () => ({
  headers: getHeaders(getCashRegisterId(0)),
});

export const callingService = {
  startCall: async () => {
    const response = await api.post<CallCreatedResponse>(
      "/calls",
      undefined,
      getRequestConfig(),
    );
    return response.data;
  },

  acceptCall: async (callId: string) => {
    const response = await api.post<CallAcceptedResponse>(
      `/calls/${encodeURIComponent(callId)}/accept`,
      undefined,
      getRequestConfig(),
    );
    return response.data;
  },

  rejectCall: async (callId: string) => {
    await api.post(`/calls/${encodeURIComponent(callId)}/reject`, undefined, getRequestConfig());
  },

  endCall: async (callId: string) => {
    await api.post(`/calls/${encodeURIComponent(callId)}/end`, undefined, getRequestConfig());
  },

  getCall: async (callId: string) => {
    const response = await api.get<CallDetails>(
      `/calls/${encodeURIComponent(callId)}`,
      getRequestConfig(),
    );
    return response.data;
  },

  getHistory: async (page = 1, pageSize = 50) => {
    const response = await api.get<CallHistoryPage>("/calls/history", {
      ...getRequestConfig(),
      params: { page, pageSize },
    });
    return response.data;
  },

  getIceServers: async () => {
    const response = await api.get<IceServerResponse>("/calls/ice-servers", getRequestConfig());
    return response.data;
  },
};
