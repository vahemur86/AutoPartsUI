export type AgentContractStatus = "Draft" | "Active" | "Completed" | "Cancelled" | "Defaulted";
export type AgentAdvanceStatus = AgentContractStatus;

export interface AgentSummaryDto {
  id: string;
  code: string;
  fullName: string;
}

export interface PagedResult<T> {
  totalItems: number;
  page: number;
  pageSize: number;
  results: T[];
}

export interface RepaymentTermsSnapshotDto {
  repaymentRuleId: string;
  repaymentRuleVersionId: string;
  ruleVersion: number;
  debtRepaymentPercent: number;
  agentPayoutPercent: number;
  excessBusinessPercent: number;
  excessAgentPercent: number;
  defaultRepaymentPeriodDays: number;
  maximumExtensions: number;
}

export interface CapitalSourceAllocationDto {
  id: string;
  capitalSourceId: string;
  capitalSourceCode: string;
  capitalSourceName: string;
  amount: number;
  referenceType: string;
  referenceId: string;
  createdAt: string;
  createdBy: string;
}

export interface AgentAdvanceDto {
  id: string;
  advanceNumber: string;
  agentContractId: string;
  agent: AgentSummaryDto;
  advancedAmount: number;
  allocatedAmount: number;
  advanceDate: string;
  status: AgentAdvanceStatus;
  notes: string | null;
  allocations: CapitalSourceAllocationDto[];
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface AgentContractListItemDto {
  id: string;
  contractNumber: string;
  agent: AgentSummaryDto;
  contractDate: string;
  status: AgentContractStatus;
  totalAdvancedAmount: number;
  totalRepaidAmount: number;
  outstandingAmount: number;
  createdAt: string;
}

export interface AgentContractDto {
  id: string;
  contractNumber: string;
  agent: AgentSummaryDto;
  contractDate: string;
  status: AgentContractStatus;
  notes: string | null;
  repaymentTerms: RepaymentTermsSnapshotDto;
  financials: {
    totalAdvancedAmount: number;
    totalRepaidAmount: number;
    outstandingAmount: number;
  };
  advances: AgentAdvanceDto[];
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface SaveAgentContractRequest {
  agentId: string;
  repaymentRuleVersionId: string;
  contractDate: string;
  notes?: string;
}

export interface CreateAgentAdvanceRequest {
  amount: number;
  advanceDate: string;
  notes?: string;
}

export interface AddCapitalSourceAllocationRequest {
  capitalSourceId: string;
  amount: number;
  description?: string;
}