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

  it("normalizes the flat agent financial summary payload returned by the backend", async () => {
    const flatSummary = {
      agentId: "ce62bdb3-3b56-4bdb-96b4-64b5cb845243",
      agentCode: "RAF000",
      agentFullName: "Rafo Krjacyan",
      activeContractsCount: 1,
      totalAdvancedAmount: 10000000,
      totalRepaidAmount: 5304000,
      totalOutstandingAmount: 4696000,
      contracts: [
        {
          contractId: "9eefd39f-b173-4ec2-b620-db491ae7c0cb",
          contractNumber: "CNT-2026-000004",
          status: "Active",
          totalAdvancedAmount: 10000000,
          totalRepaidAmount: 5304000,
          outstandingAmount: 4696000,
          activeAdvancesCount: 1,
        },
      ],
      lastRepaymentsDate: "2026-09-28T13:54:35.9977898Z",
      recentRepaymentCount: 0,
    };

    vi.mocked(api.get).mockResolvedValue({ data: flatSummary });

    const result = await agentsService.getAgentFinancialSummary("ce62bdb3-3b56-4bdb-96b4-64b5cb845243");

    expect(result).toMatchObject({
      agent: {
        id: "ce62bdb3-3b56-4bdb-96b4-64b5cb845243",
        name: "Rafo Krjacyan",
        code: "RAF000",
        status: "Active",
        totalAdvancedAmount: 10000000,
        totalRepaidAmount: 5304000,
        outstandingAmount: 4696000,
      },
      contract: {
        id: "9eefd39f-b173-4ec2-b620-db491ae7c0cb",
        number: "CNT-2026-000004",
        status: "Active",
      },
      advances: [],
      recentDeliveries: [],
      recentRepayments: [],
    });
  });
});
