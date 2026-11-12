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

export interface AgentPortalFinancialAdvance {
  advanceId?: string | null;
  advanceNumber?: string | null;
  advanceType?: string | null;
  status?: string | null;
  advanceDate?: string | null;
  advancedAmountAmd?: number | null;
  repaymentDeadline?: string | null;
  extensionCount?: number | null;
  productSaleId?: number | null;
}

export interface AgentPortalFinancialContract {
  contractId?: string | null;
  contractNumber?: string | null;
  status?: string | null;
  totalAdvancedAmount?: number | null;
  totalRepaidAmount?: number | null;
  outstandingAmount?: number | null;
  activeAdvancesCount?: number | null;
  contractType?: "Dust" | "ProductCredit" | string | null;
  contractDate?: string | null;
  repaymentDeadline?: string | null;
  productCreditLimitAmd?: number | null;
  productCreditOutstandingAmd?: number | null;
  productCreditAvailableAmd?: number | null;
  productCreditDiscountPercent?: number | null;
  restoreProductCreditLimitAfterRepayment?: boolean | null;
  acceptsNewProductPurchases?: boolean | null;
  productCreditDeadline?: string | null;
  advances?: AgentPortalFinancialAdvance[] | null;
}

export interface AgentPortalFinancialSummary {
  agentId?: string;
  agentCode?: string | null;
  agentFullName?: string | null;
  activeContractsCount?: number | null;
  totalAdvancedAmount?: number | null;
  totalRepaidAmount?: number | null;
  totalOutstandingAmount?: number | null;
  contracts?: AgentPortalFinancialContract[] | null;
  lastRepaymentsDate?: string | null;
  recentRepaymentCount?: number | null;
  balances?: AgentPortalBalances | null;
  totalAdvancedAmountAmd?: number | null;
  totalRepaidAmountAmd?: number | null;
  totalOutstandingAmountAmd?: number | null;
  agent?: {
    name?: string;
    code?: string;
    status?: string;
    totalAdvancedAmount?: number;
    totalRepaidAmount?: number;
    outstandingAmount?: number;
  };
}

export interface AgentPortalBalances {
  agentId?: string;
  currency?: string | null;
  productCreditLimitAmd?: number | null;
  productCreditOutstandingAmd?: number | null;
  productCreditAvailableAmd?: number | null;
  powderAdvanceOutstandingAmd?: number | null;
  productCreditContracts?: Array<{
    contractId?: string;
    contractNumber?: string;
    status?: string;
    creditLimitAmd?: number | null;
    outstandingAmountAmd?: number | null;
    availableCreditAmd?: number | null;
    acceptsNewPurchases?: boolean | null;
    deadline?: string | null;
  }> | null;
}

export type AgentNotificationType =
  | "ContractActivated"
  | "ContractUpdated"
  | "OrderApproved"
  | "OrderRejected";

export interface AgentNotification {
  id: string;
  type: AgentNotificationType;
  title: string;
  message: string;
  relatedEntityType: "AgentContract" | "AgentOrderRequest" | "AgentAdvance" | null;
  relatedEntityId: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface AgentNotificationPage {
  totalItems: number;
  page: number;
  pageSize: number;
  unreadCount: number;
  results: AgentNotification[];
}

export interface CashierNotification {
  id: string;
  agentOrderRequestId: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface CashierNotificationPage {
  totalItems: number;
  page: number;
  pageSize: number;
  results: CashierNotification[];
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
  shopId?: number | null;
  status: AgentOrderRequestStatus | number | string;
  notes: string | null;
  items: AgentOrderRequestItem[];
  requestedAt: string;
  approvedShopId: number | null;
  posSaleId: number | null;
  decidedAt: string | null;
  decisionNote: string | null;
}

export interface CashierOrderPricePreviewItem {
  productId: number;
  productCode: string;
  productSku: string;
  quantity: number;
  shopSalePriceAmd: number;
  discountedUnitPriceAmd: number;
  discountAmountAmd: number;
  lineTotalAmd: number;
  availableStock: number;
  hasSufficientStock: boolean;
}

export interface CashierOrderPricePreview {
  orderRequestId: string;
  shopId: number;
  agentContractId: string;
  contractNumber: string;
  discountPercent: number;
  currency: string;
  items: CashierOrderPricePreviewItem[];
  subtotalAmd: number;
  discountAmountAmd: number;
  totalAmountAmd: number;
  availableCreditAmd: number;
  hasSufficientCredit: boolean;
  hasSufficientStock: boolean;
  canApprove: boolean;
  priceCheckedAtUtc: string;
}

export interface CashierPOSSaleItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  originalUnitPrice: number;
}

export interface CashierPOSSale {
  id: number;
  totalAmount: number;
  cashPaid: number;
  nonCashPaid: number;
  items: CashierPOSSaleItem[];
}

export interface CreateAgentOrderRequest {
  shopId: number;
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
