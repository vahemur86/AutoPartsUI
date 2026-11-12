import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/utils", () => ({
  getCashRegisterId: () => 6,
  getHeaders: (cashRegisterId?: number) =>
    cashRegisterId ? { "X-CashRegister-Id": String(cashRegisterId) } : {},
}));

import api from "@/services";
import { agentPortalService } from "./agentPortal";

describe("agentPortalService.getBalances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads backend-calculated product credit and powder advance balances", async () => {
    const balances = {
      agentId: "agent-1",
      currency: "AMD",
      productCreditLimitAmd: 400000,
      productCreditOutstandingAmd: 400000,
      productCreditAvailableAmd: 0,
      powderAdvanceOutstandingAmd: 100000,
      productCreditContracts: [],
    };
    vi.mocked(api.get).mockResolvedValue({ data: balances });

    await expect(agentPortalService.getBalances()).resolves.toEqual(balances);
    expect(api.get).toHaveBeenCalledWith("/agent-portal/balances");
  });
});

describe("agentPortalService.createOrderRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes the agent-selected shop in the request", async () => {
    const request = { id: "request-1", shopId: 6, status: "Pending" };
    vi.mocked(api.post).mockResolvedValue({ data: request });

    await agentPortalService.createOrderRequest({
      shopId: 6,
      items: [{ productId: 12, quantity: 2 }],
    });

    expect(api.post).toHaveBeenCalledWith("/agent-portal/order-requests", {
      shopId: 6,
      items: [{ productId: 12, quantity: 2 }],
    });
  });
});

describe("agentPortalService.approveOrderRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the selected Product Credit contract ID when provided", async () => {
    const approved = { id: "request-1", status: "Approved" };
    vi.mocked(api.post).mockResolvedValue({ data: approved });

    const result = await agentPortalService.approveOrderRequest("request/1", "contract-1");

    expect(api.post).toHaveBeenCalledWith(
      "/agent-order-requests/request%2F1/approve",
      { agentContractId: "contract-1" },
      { headers: { "X-CashRegister-Id": "6" } },
    );
    expect(result).toEqual(approved);
  });

  it("does not allow approval without the contract selected for the preview", async () => {
    const approved = { id: "request-1", status: "Approved" };
    vi.mocked(api.post).mockResolvedValue({ data: approved });

    await agentPortalService.approveOrderRequest("request-1", "contract-2");

    expect(api.post).toHaveBeenCalledWith(
      "/agent-order-requests/request-1/approve",
      { agentContractId: "contract-2" },
      { headers: { "X-CashRegister-Id": "6" } },
    );
  });
});

describe("agentPortalService cashier price preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the backend price preview with the chosen contract and cashier context", async () => {
    const preview = { orderRequestId: "request-1", agentContractId: "contract-1", canApprove: true };
    vi.mocked(api.get).mockResolvedValue({ data: preview });

    await expect(agentPortalService.getCashierOrderPricePreview("request/1", "contract-1")).resolves.toEqual(preview);
    expect(api.get).toHaveBeenCalledWith("/agent-order-requests/request%2F1/price-preview", {
      params: { agentContractId: "contract-1" },
      headers: { "X-CashRegister-Id": "6" },
    });
  });

  it("loads the final saved sale using the cashier context", async () => {
    const sale = { id: 17, totalAmount: 12000, items: [] };
    vi.mocked(api.get).mockResolvedValue({ data: sale });

    await expect(agentPortalService.getCashierPOSSale(17)).resolves.toEqual(sale);
    expect(api.get).toHaveBeenCalledWith("/POSSale/17", {
      headers: { "X-CashRegister-Id": "6" },
    });
  });
});

describe("agentPortalService cashier notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the current cashier's inbox with paging and the cash-register context", async () => {
    const notificationPage = {
      totalItems: 1,
      page: 1,
      pageSize: 50,
      results: [{ id: "notification-1", agentOrderRequestId: "request-1" }],
    };
    vi.mocked(api.get).mockResolvedValue({ data: notificationPage });

    await expect(agentPortalService.getCashierNotifications()).resolves.toEqual(notificationPage);
    expect(api.get).toHaveBeenCalledWith("/cashier-portal/notifications", {
      params: { page: 1, pageSize: 50 },
      headers: { "X-CashRegister-Id": "6" },
    });
  });

  it("deletes only the selected notification using the current cashier context", async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await agentPortalService.deleteCashierNotification("notification/1");

    expect(api.delete).toHaveBeenCalledWith(
      "/cashier-portal/notifications/notification%2F1",
      { headers: { "X-CashRegister-Id": "6" } },
    );
  });
});

describe("agentPortalService notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the current agent's paginated notifications without an agent ID", async () => {
    const page = {
      totalItems: 1,
      page: 2,
      pageSize: 25,
      unreadCount: 3,
      results: [{ id: "notification-1", readAt: null }],
    };
    vi.mocked(api.get).mockResolvedValue({ data: page });

    await expect(agentPortalService.getNotifications(2, 25)).resolves.toEqual(page);
    expect(api.get).toHaveBeenCalledWith("/agent-portal/notifications", {
      params: { page: 2, pageSize: 25 },
    });
  });

  describe("agentPortalService order requests", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("loads an individual order request by its encoded ID", async () => {
      const order = { id: "request-1", status: "Approved", decisionNote: null };
      vi.mocked(api.get).mockResolvedValue({ data: order });

      await expect(agentPortalService.getOrderRequest("request/1")).resolves.toEqual(order);
      expect(api.get).toHaveBeenCalledWith("/agent-portal/order-requests/request%2F1");
    });
  });
  it("marks a single notification as read", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: undefined });

    await agentPortalService.markNotificationAsRead("notification/1");

    expect(api.post).toHaveBeenCalledWith("/agent-portal/notifications/notification%2F1/read");
  });

  it("marks all notifications as read", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: undefined });

    await agentPortalService.markAllNotificationsAsRead();

    expect(api.post).toHaveBeenCalledWith("/agent-portal/notifications/read-all");
  });

  it("deletes a notification", async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await agentPortalService.deleteNotification("notification/1");

    expect(api.delete).toHaveBeenCalledWith("/agent-portal/notifications/notification%2F1");
  });
});
