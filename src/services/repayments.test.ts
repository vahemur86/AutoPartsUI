import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/index", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from "@/services/index";
import { repaymentsService } from "./repayments";

describe("repaymentsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads automatic successful repayments with filters", async () => {
    const payload = {
      items: [
        {
          id: "rep-1",
          repaymentNumber: "REP-2026-001001",
          agentName: "Jane Smith",
          source: "Automatic",
          status: "Success",
          repaymentAmount: 1500,
          deliveryNumber: "DLV-1001",
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 20,
    };

    vi.mocked(api.get).mockResolvedValue({ data: payload });

    const result = await repaymentsService.listRepayments({
      source: "Automatic",
      status: "Success",
      page: 1,
      pageSize: 20,
    });

    expect(api.get).toHaveBeenCalledWith("/repayments", {
      params: {
        source: "Automatic",
        status: "Success",
        page: 1,
        pageSize: 20,
      },
    });
    expect(result).toEqual(payload);
  });

  it("normalizes backend pagination responses that use totalItems and results", async () => {
    const payload = {
      totalItems: 2,
      page: 1,
      pageSize: 20,
      results: [
        {
          id: "rep-1",
          repaymentNumber: "REP-2026-001001",
          agentName: "Jane Smith",
          source: "Manual",
          status: "Success",
          debtRepaymentAmd: 53500,
          deliveryNumber: "DEL-2026-000004",
        },
      ],
    };

    vi.mocked(api.get).mockResolvedValue({ data: payload });

    const result = await repaymentsService.listRepayments({
      source: "Manual",
      page: 1,
      pageSize: 20,
    });

    expect(result).toEqual({
      items: payload.results,
      totalCount: 2,
      page: 1,
      pageSize: 20,
    });
  });

  it("loads the automatic repayment dashboard summary", async () => {
    const payload = {
      totalProcessed: 15,
      totalSuccessful: 13,
      totalFailed: 2,
      successRate: 0.87,
      recentRepayments: [],
      topFailureReasons: [],
    };

    vi.mocked(api.get).mockResolvedValue({ data: payload });

    const result = await repaymentsService.getAutomaticRepaymentDashboardSummary(30);

    expect(api.get).toHaveBeenCalledWith("/repayments/dashboard/automatic-status", { params: { days: 30 } });
    expect(result).toEqual(payload);
  });
});
