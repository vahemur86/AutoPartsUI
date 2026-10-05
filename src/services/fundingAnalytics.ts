import { api } from "@/services/index";
import type {
  AgentAdvanceFundingAnalyticsDto,
  AgentProfitabilityAnalyticsDto,
  AgentProfitabilityAnalyticsParams,
  CapitalSourceFundingAnalyticsDto,
  FundingAnalyticsDateFilter,
  FundingDailyCostDto,
  GlobalAgentProfitabilityParams,
} from "@/types/fundingAnalytics";

export const fundingAnalyticsService = {
  getCapitalSourceFundingAnalytics: async (
    capitalSourceId: string,
    params?: FundingAnalyticsDateFilter,
  ) => {
    const response = await api.get<CapitalSourceFundingAnalyticsDto>(
      `/analytics/funding/capital-sources/${capitalSourceId}`,
      { params },
    );
    return response.data;
  },

  getCapitalSourceFundingCostHistory: async (
    capitalSourceId: string,
    params?: FundingAnalyticsDateFilter,
  ) => {
    const response = await api.get<FundingDailyCostDto[]>(
      `/analytics/funding/capital-sources/${capitalSourceId}/funding-cost-history`,
      { params },
    );
    return response.data ?? [];
  },

  getAgentAdvanceFundingAnalytics: async (
    advanceId: string,
    params?: FundingAnalyticsDateFilter,
  ) => {
    const response = await api.get<AgentAdvanceFundingAnalyticsDto>(
      `/analytics/funding/advances/${advanceId}`,
      { params },
    );
    return response.data;
  },

  getAgentProfitabilityAnalytics: async (
    agentId: string,
    params?: AgentProfitabilityAnalyticsParams,
  ) => {
    const response = await api.get<AgentProfitabilityAnalyticsDto>(
      `/analytics/funding/agents/${agentId}`,
      { params },
    );
    return response.data;
  },

  getGlobalAgentProfitabilityAnalytics: async (
    params?: GlobalAgentProfitabilityParams,
  ) => {
    const response = await api.get<AgentProfitabilityAnalyticsDto>(
      "/analytics/funding/agent-profitability",
      { params },
    );
    return response.data;
  },
};
