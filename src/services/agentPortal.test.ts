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

describe("agentPortalService.approveOrderRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the explicitly selected shop and Product Credit contract", async () => {
    const approved = { id: "request-1", status: "Approved" };
    vi.mocked(api.post).mockResolvedValue({ data: approved });

    const result = await agentPortalService.approveOrderRequest("request/1", 6, "contract-1");

    expect(api.post).toHaveBeenCalledWith(
      "/agent-order-requests/request%2F1/approve",
      { shopId: 6, agentContractId: "contract-1" },
      { headers: { "X-CashRegister-Id": "6" } },
    );
    expect(result).toEqual(approved);
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
