export type RepaymentRule = {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive";
  currentVersion?: number | null;
  createdAt: string;
};

export type RepaymentRuleVersionStatus = "Draft" | "Active" | "Expired";

export type RepaymentRuleVersion = {
  id: string;
  ruleId: string;
  version: number;
  status: RepaymentRuleVersionStatus;
  debtRepaymentPercent: number;
  agentPayoutPercent: number;
  excessBusinessPercent: number;
  excessAgentPercent: number;
  defaultRepaymentPeriodDays: number;
  maximumExtensions: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string | null;
  createdAt: string;
  createdBy?: string | null;
};

export type CreateRepaymentRuleRequest = {
  code: string;
  name: string;
  description?: string;
};

export type CreateRepaymentRuleVersionRequest = {
  debtRepaymentPercent: number;
  agentPayoutPercent: number;
  excessBusinessPercent: number;
  excessAgentPercent: number;
  defaultRepaymentPeriodDays: number;
  maximumExtensions: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string | null;
};
