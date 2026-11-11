import api from "@/services";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type {
  AgentDto,
  AgentProductCreditSaleDto,
  AgentProductDebtDto,
  AgentProductDebtPaymentDto,
  AgentTypeHistoryDto,
  PagedResult,
} from "@/types/agents";
import type { AgentAdvanceDto, AgentContractListItemDto } from "@/types/agentContracts";
import type { PowderDeliveryDto, PowderDeliveryListItemDto } from "@/types/powderDeliveries";
import type { ShopProductItem } from "@/types/warehouses/warehouseProduct";
import type {
  AgentOrderRequest,
  AgentOrderRequestStatus,
  AgentNotificationPage,
  AgentPortalFinancialSummary,
  CreateAgentOrderRequest,
} from "@/types/agentPortal";

const request = async <T>(action: () => Promise<{ data: T }>, fallback: string) => {
  try {
    const response = await action();
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, fallback));
  }
};

export const agentPortalService = {
  getProfile: () =>
    request<AgentDto>(() => api.get("/agent-portal/profile"), "Failed to load agent profile."),

  getFinancialSummary: () =>
    request<AgentPortalFinancialSummary>(() => api.get("/agent-portal/financial-summary"), "Failed to load financial summary."),

  getTypeHistory: () =>
    request<AgentTypeHistoryDto[]>(() => api.get("/agent-portal/type-history"), "Failed to load agent type history."),

  getContracts: (page = 1, pageSize = 10) =>
    request(
      () => api.get<PagedResult<AgentContractListItemDto>>("/agent-portal/contracts", { params: { page, pageSize } }),
      "Failed to load contracts.",
    ),

  getAdvances: (page = 1, pageSize = 10) =>
    request(
      () => api.get<PagedResult<AgentAdvanceDto>>("/agent-portal/advances", { params: { page, pageSize } }),
      "Failed to load advances.",
    ),

  getDeliveries: (
    page = 1,
    pageSize = 10,
    filters?: { status?: string; deliveryDateFrom?: string; deliveryDateTo?: string },
  ) =>
    request(
      () =>
        api.get<PagedResult<PowderDeliveryListItemDto>>("/agent-portal/powder-deliveries", {
          params: { ...filters, page, pageSize },
        }),
      "Failed to load powder deliveries.",
    ),

  getDeliveryDetails: (id: string) =>
    request<PowderDeliveryDto>(
      () => api.get(`/agent-portal/powder-deliveries/${id}`),
      "Failed to load powder delivery details.",
    ),

  getProductDebt: (contractId?: string) =>
    request(
      () =>
        api.get<AgentProductDebtDto>("/agent-portal/product-debt", {
          params: contractId ? { contractId } : undefined,
        }),
      "Failed to load product debt.",
    ),

  getCreditSales: (page = 1, pageSize = 10) =>
    request(
      () => api.get<PagedResult<AgentProductCreditSaleDto>>("/agent-portal/product-credit-sales", { params: { page, pageSize } }),
      "Failed to load product credit sales.",
    ),

  getDebtPayments: () =>
    request(
      () => api.get<AgentProductDebtPaymentDto[]>("/agent-portal/product-debt-payments"),
      "Failed to load product debt payments.",
    ),

  getOrderRequests: (
    status?: AgentOrderRequestStatus,
    page = 1,
    pageSize = 10,
  ) =>
    request(
      () =>
        api.get<PagedResult<AgentOrderRequest>>("/agent-portal/order-requests", {
          params: { ...(status ? { status } : {}), page, pageSize },
        }),
      "Failed to load order requests.",
    ),

  getOrderRequest: (id: string) =>
    request(
      () => api.get<AgentOrderRequest>(`/agent-portal/order-requests/${encodeURIComponent(id)}`),
      "Failed to load order request.",
    ),

  getNotifications: (page = 1, pageSize = 50) =>
    request<AgentNotificationPage>(
      () => api.get("/agent-portal/notifications", { params: { page, pageSize } }),
      "Failed to load notifications.",
    ),

  markNotificationAsRead: (id: string) =>
    request<void>(
      () => api.post(`/agent-portal/notifications/${encodeURIComponent(id)}/read`),
      "Failed to mark notification as read.",
    ),

  markAllNotificationsAsRead: () =>
    request<void>(
      () => api.post("/agent-portal/notifications/read-all"),
      "Failed to mark notifications as read.",
    ),

  deleteNotification: (id: string) =>
    request<void>(
      () => api.delete(`/agent-portal/notifications/${encodeURIComponent(id)}`),
      "Failed to delete notification.",
    ),

  getShopProducts: (shopId: number) =>
    request<ShopProductItem[]>(
      () => api.get(`/WarehouseProduct/shop/${shopId}/products`),
      "Failed to load products for this shop.",
    ).then((items) =>
      items.map((item) => ({
        ...item,
        productId: item.productId ?? item.product?.id,
      })),
    ),

  createOrderRequest: (payload: CreateAgentOrderRequest) =>
    request(
      () => api.post<AgentOrderRequest>("/agent-portal/order-requests", payload),
      "Failed to submit order request.",
    ),

  getCashierOrderRequests: (
    status: AgentOrderRequestStatus | undefined,
    page = 1,
    pageSize = 10,
  ) =>
    request(
      () =>
        api.get<PagedResult<AgentOrderRequest>>("/agent-order-requests", {
          params: { ...(status ? { status } : {}), page, pageSize },
        }),
      "Failed to load agent order requests.",
    ),

  getCashierOrderRequest: (id: string) =>
    request(
      () => api.get<AgentOrderRequest>(`/agent-order-requests/${encodeURIComponent(id)}`),
      "Failed to load order request.",
    ),

  approveOrderRequest: (id: string, shopId: number, agentContractId: string) =>
    request(
      () => api.post<AgentOrderRequest>(
        `/agent-order-requests/${encodeURIComponent(id)}/approve`,
        { shopId, agentContractId },
      ),
      "Unable to approve order request.",
    ),

  rejectOrderRequest: (id: string, reason: string) =>
    request(
      () => api.post<void>(
        `/agent-order-requests/${encodeURIComponent(id)}/reject`,
        { reason },
      ),
      "Unable to reject order request.",
    ),
};
