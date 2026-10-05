export interface FundingDailyCostDto {
  date: string;
  capitalSourceId: string;
  agentAdvanceId: string | null;
  originalPrincipal: number;
  outstandingPrincipal: number;
  annualInterestRate: number;
  dayCount: number;
  dailyFundingCost: number;
  cumulativeFundingCost: number;
}

export interface CapitalSourceFundingAnalyticsDto {
  capitalSourceId: string;
  code: string | null;
  name: string | null;
  originalPrincipal: number;
  currentAvailableBalance: number;
  currentOutstandingPrincipal: number;
  annualInterestRate: number;
  dailyFundingCost: number;
  accruedFundingCost: number;
  dailyHistory: FundingDailyCostDto[] | null;
}

export interface AgentAdvanceFundingAllocationDto {
  allocationId: string;
  capitalSourceId: string;
  allocatedPrincipal: number;
  outstandingPrincipal: number;
  annualInterestRate: number;
  fundingCost: number;
  daysOutstanding: number;
}

export interface AgentAdvanceFundingAnalyticsDto {
  agentAdvanceId: string;
  agentId: string;
  agentContractId: string;
  originalAdvanceAmount: number;
  currentOutstandingAdvance: number;
  status: string | null;
  advanceDate: string;
  closedDate: string | null;
  totalAcceptedPowderValue: number;
  totalKitcoValue: number;
  totalAgentPayout: number;
  grossCatalystMargin: number;
  fundingCost: number;
  netProfitLoss: number;
  roiPercent: number;
  totalDaysOutstanding: number;
  allocations: AgentAdvanceFundingAllocationDto[] | null;
  dailyHistory: FundingDailyCostDto[] | null;
}

export interface PagedAgentAdvanceFundingAnalyticsDto {
  totalItems: number;
  page: number;
  pageSize: number;
  results: AgentAdvanceFundingAnalyticsDto[] | null;
}

export interface AgentProfitabilityAnalyticsDto {
  fromDate: string;
  toDate: string;
  totalCapital: number;
  totalOutstandingCapital: number;
  totalFundingCost: number;
  totalAgentFunding: number;
  totalAgentOutstanding: number;
  totalKitcoValue: number;
  totalAgentPayout: number;
  totalGrossCatalystMargin: number;
  totalNetProfitLoss: number;
  roiPercent: number;
  advances: PagedAgentAdvanceFundingAnalyticsDto;
}

export interface FundingAnalyticsDateFilter {
  fromDate?: string;
  toDate?: string;
}

export interface AgentProfitabilityAnalyticsParams extends FundingAnalyticsDateFilter {
  capitalSourceId?: string;
  page?: number;
  pageSize?: number;
}

export interface GlobalAgentProfitabilityParams extends AgentProfitabilityAnalyticsParams {
  agentId?: string;
}
