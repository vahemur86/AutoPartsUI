import type {
  AgentDto,
  AgentProductCreditSaleDto,
  AgentProductDebtDto,
  AgentProductDebtPaymentDto,
  AgentTypeHistoryDto,
  PagedResult,
} from "./agents";
import type { AgentAdvanceDto, AgentContractListItemDto } from "./agentContracts";
import type { PowderDeliveryListItemDto } from "./powderDeliveries";

export type AgentOrderRequestStatus = "Pending" | "Approved" | "Rejected";

export interface AgentPortalFinancialSummary {
  activeContractsCount?: number;
  totalAdvancedAmount?: number;
  totalAdvancedAmountAmd?: number;
  totalRepaidAmount?: number;
  totalRepaidAmountAmd?: number;
  totalOutstandingAmount?: number;
  totalOutstandingAmountAmd?: number;
  agent?: {
    name?: string;
    code?: string;
    status?: string;
    totalAdvancedAmount?: number;
    totalRepaidAmount?: number;
    outstandingAmount?: number;
  };
  contracts?: Array<{
    contractId?: string;
    contractNumber?: string;
    status?: string;
    totalAdvancedAmount?: number;
    totalRepaidAmount?: number;
    outstandingAmount?: number;
  }>;
}

export interface AgentOrderRequestItem {
  productId: number;
  quantity: number;
  productCode?: string | null;
  productName?: string | null;
}

export interface AgentOrderRequest {
  id: string;
  agentId: string;
  agentCode: string;
  agentName: string;
  status: AgentOrderRequestStatus | number | string;
  notes: string | null;
  items: AgentOrderRequestItem[];
  requestedAt: string;
  approvedShopId: number | null;
  posSaleId: number | null;
  decidedAt: string | null;
  decisionNote: string | null;
}

export interface CreateAgentOrderRequest {
  items: Array<{ productId: number; quantity: number }>;
  notes?: string;
}

export interface AgentPortalData {
  profile: AgentDto;
  summary: AgentPortalFinancialSummary;
  typeHistory: AgentTypeHistoryDto[];
  contracts: PagedResult<AgentContractListItemDto>;
  advances: PagedResult<AgentAdvanceDto>;
  deliveries: PagedResult<PowderDeliveryListItemDto>;
  productDebt: AgentProductDebtDto;
  creditSales: PagedResult<AgentProductCreditSaleDto>;
  debtPayments: AgentProductDebtPaymentDto[];
}
