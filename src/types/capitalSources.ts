export type CapitalSourceType = "BankLoan" | "OwnerInvestment" | "Other";

export type CapitalSourceStatus = "Active" | "Inactive" | "Closed";

export type CapitalSourceTransactionType =
  | "MoneyReceived"
  | "AgentAllocation"
  | "MoneyReturned"
  | "OtherIncome"
  | "OtherExpense";

export interface CapitalSourceDto {
  id: string;
  code: string;
  name: string;
  type: CapitalSourceType;
  initialAmount: number;
  currentBalance: number;
  interestRate?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status: CapitalSourceStatus;
  description?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface CapitalSourceTransactionDto {
  id: string;
  capitalSourceId: string;
  type: CapitalSourceTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
}

export interface PagedCapitalSources {
  totalItems: number;
  page: number;
  pageSize: number;
  results: CapitalSourceDto[];
}

export interface CreateCapitalSourceRequest {
  code: string;
  name: string;
  type: CapitalSourceType;
  initialAmount: number;
  interestRate?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

export interface UpdateCapitalSourceRequest {
  code: string;
  name: string;
  type: CapitalSourceType;
  initialAmount: number;
  interestRate?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

export interface CapitalSourceMoneyRequest {
  amount: number;
  description?: string | null;
}
