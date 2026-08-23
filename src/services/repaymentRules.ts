import { api } from "@/services/index";
import type {
  RepaymentRule,
  RepaymentRuleVersion,
  CreateRepaymentRuleRequest,
  CreateRepaymentRuleVersionRequest,
} from "@/types/repaymentRules";

export const repaymentRulesService = {
  createRepaymentRule: async (data: CreateRepaymentRuleRequest) => {
    const res = await api.post<RepaymentRule>("/api/repayment-rules", data);
    return res.data;
  },

  getRepaymentRules: async () => {
    const res = await api.get<RepaymentRule[]>("/api/repayment-rules");
    return res.data;
  },

  getRepaymentRule: async (id: string) => {
    const res = await api.get<RepaymentRule>(`/api/repayment-rules/${id}`);
    return res.data;
  },

  createRepaymentRuleVersion: async (
    ruleId: string,
    data: CreateRepaymentRuleVersionRequest,
  ) => {
    const res = await api.post<RepaymentRuleVersion>(
      `/api/repayment-rules/${ruleId}/versions`,
      data,
    );
    return res.data;
  },

  getRepaymentRuleVersions: async (ruleId: string) => {
    const res = await api.get<RepaymentRuleVersion[]>(
      `/api/repayment-rules/${ruleId}/versions`,
    );
    return res.data;
  },

  getRepaymentRuleVersion: async (versionId: string) => {
    const res = await api.get<RepaymentRuleVersion>(
      `/api/repayment-rules/versions/${versionId}`,
    );
    return res.data;
  },

  activateRepaymentRule: async (ruleId: string) => {
    await api.post(`/api/repayment-rules/${ruleId}/activate`);
  },

  deactivateRepaymentRule: async (ruleId: string) => {
    await api.post(`/api/repayment-rules/${ruleId}/deactivate`);
  },

  activateRepaymentRuleVersion: async (versionId: string) => {
    await api.post(`/api/repayment-rules/versions/${versionId}/activate`);
  },

  expireRepaymentRuleVersion: async (versionId: string) => {
    await api.post(`/api/repayment-rules/versions/${versionId}/expire`);
  },
};
