import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/services/index", () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from "@/services/index";
import { agentsService } from "./agents";

describe("agentsService.getAgentFinancialSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the financial summary endpoint for the given agent", async () => {
    const summary = {
      agent: {
        id: "agent-1",
        name: "Jane Smith",
        code: "AG-001",
        status: "Active",
        totalAdvancedAmount: 5000,
        totalRepaidAmount: 2500,
        outstandingAmount: 2500,
      },
      contract: {
        id: "contract-1",
        number: "CON-1001",
        status: "Active",
        effectiveDate: "2026-01-01T00:00:00Z",
        debtRepaymentPercent: 80,
        agentPayoutPercent: 20,
        excessBusinessPercent: 70,
        excessAgentPercent: 30,
        defaultRepaymentPeriodDays: 30,
        maximumExtensions: 2,
      },
      advances: [],
      recentDeliveries: [],
      recentRepayments: [],
    };

    vi.mocked(api.get).mockResolvedValue({ data: summary });

    const result = await agentsService.getAgentFinancialSummary("agent-1");

    expect(api.get).toHaveBeenCalledWith("/agents/agent-1/financial-summary");
    expect(result).toEqual(summary);
  });
});
