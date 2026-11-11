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
  type: "Dust" | "ProductCredit";
  debtRepaymentPercent: number | null;
  agentPayoutPercent: number | null;
  excessBusinessPercent: number | null;
  excessAgentPercent: number | null;
  defaultRepaymentPeriodDays: number;
  maximumExtensions: number | null;
  maximumProductCreditExtensions?: number | null;
}

export interface CapitalSourceAllocationDto {
  id: string;
  capitalSourceId: string;
  capitalSourceCode: string;
  capitalSourceName: string;
  amount: number;
  description?: string | null;
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
  advanceType?: string | null;
  productSaleId?: string | number | null;
  allocatedAmount: number;
  advanceDate: string;
  repaymentDeadline?: string | null;
  extensionCount?: number;
  maximumExtensions?: number;
  repaymentTerms?: RepaymentTermsSnapshotDto | null;
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
  repaymentDeadline?: string | null;
  status: AgentContractStatus;
  allowsProductAdvance?: boolean | null;
  productCreditLimitAmd?: number | null;
  productCreditDiscountPercent?: number | null;
  restoreProductCreditLimitAfterRepayment?: boolean | null;
  acceptsNewProductPurchases?: boolean | null;
  productCreditDeadline?: string | null;
  approvedShopIds?: number[] | null;
  repaymentTerms?: RepaymentTermsSnapshotDto | null;
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
  repaymentDeadline?: string | null;
  status: AgentContractStatus;
  allowsProductAdvance?: boolean;
  productCreditLimitAmd?: number | null;
  productCreditDiscountPercent?: number | null;
  restoreProductCreditLimitAfterRepayment?: boolean | null;
  acceptsNewProductPurchases?: boolean | null;
  productCreditDeadline?: string | null;
  approvedShopIds?: number[] | null;
  availableProductCreditAmd?: number | null;
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
  allowsProductAdvance: boolean;
  notes?: string;
}

export interface SaveProductCreditTermsRequest {
  creditLimitAmd: number;
  discountPercent: number;
  restoreCreditLimitAfterRepayment: boolean;
  acceptsNewPurchases: boolean;
}

export interface ExtendProductCreditDeadlineRequest {
  newDeadline: string;
  reason: string;
}

export interface AgentProductContractSelectionDto {
  contractId: string;
  contractNumber: string;
  creditLimitAmd: number;
  outstandingAmountAmd: number;
  availableCreditAmd: number;
  discountPercent: number;
  productCreditDeadline: string;
  termsVersion: number;
}

export interface CreateAgentAdvanceRequest {
  amount: number;
  advanceDate: string;
  notes?: string;
  allocations: AddCapitalSourceAllocationRequest[];
}

export interface AddCapitalSourceAllocationRequest {
  capitalSourceId: string;
  amount: number;
  description?: string;
}

export interface AgentAdvanceExtensionDto {
  id: string;
  extensionNumber: string;
  agentAdvanceId: string;
  previousDeadline: string;
  newDeadline: string;
  reason?: string | null;
  createdAt: string;
  createdBy: string;
}

export interface CreateAgentAdvanceExtensionRequest {
  newDeadline: string;
  reason?: string | null;
}