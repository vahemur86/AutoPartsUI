export type RepaymentRuleType = "Dust" | "ProductCredit";

export type RepaymentRule = {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: RepaymentRuleType;
  status: number | string | null;
  currentVersion?: number | null;
  createdAt: string;
};

export type RepaymentRuleVersionStatus = number | string | null;

export type RepaymentRuleVersion = {
  id: string;
  ruleId: string;
  type: RepaymentRuleType;
  version: number;
  status: RepaymentRuleVersionStatus;
  debtRepaymentPercent: number | null;
  agentPayoutPercent: number | null;
  excessBusinessPercent: number | null;
  excessAgentPercent: number | null;
  defaultRepaymentPeriodDays: number;
  maximumExtensions: number | null;
  maximumProductCreditExtensions: number | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string | null;
  createdAt: string;
  createdBy?: string | null;
};

export type CreateRepaymentRuleRequest = {
  code: string;
  name: string;
  type: RepaymentRuleType;
  description?: string;
};

type CreateRepaymentRuleVersionBase = {
  defaultRepaymentPeriodDays: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string | null;
};

export type CreateRepaymentRuleVersionRequest =
  | (CreateRepaymentRuleVersionBase & {
      debtRepaymentPercent: number;
      agentPayoutPercent: number;
      excessBusinessPercent: number;
      excessAgentPercent: number;
      maximumExtensions: number;
      maximumProductCreditExtensions?: never;
    })
  | (CreateRepaymentRuleVersionBase & {
      debtRepaymentPercent?: never;
      agentPayoutPercent?: never;
      excessBusinessPercent?: never;
      excessAgentPercent?: never;
      maximumExtensions?: never;
      maximumProductCreditExtensions: number | null;
    });
