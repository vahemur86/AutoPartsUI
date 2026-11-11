import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/index", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from "@/services/index";
import { repaymentRulesService } from "./repaymentRules";

describe("repaymentRulesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters repayment rules by type when requested", async () => {
    const rules = [{ id: "rule-1", type: "ProductCredit" }];
    vi.mocked(api.get).mockResolvedValue({ data: rules });

    await repaymentRulesService.getRepaymentRules("ProductCredit");

    expect(api.get).toHaveBeenCalledWith("/repayment-rules", {
      params: { type: "ProductCredit" },
    });
  });

  it("loads both repayment rule types when no filter is provided", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await repaymentRulesService.getRepaymentRules();

    expect(api.get).toHaveBeenCalledWith("/repayment-rules", {
      params: undefined,
    });
  });

  it("creates a typed repayment rule", async () => {
    const request = {
      code: "PROD-30D",
      name: "Product 30 days",
      description: "Optional",
      type: "ProductCredit" as const,
    };
    vi.mocked(api.post).mockResolvedValue({ data: { id: "rule-1" } });

    await repaymentRulesService.createRepaymentRule(request);

    expect(api.post).toHaveBeenCalledWith("/repayment-rules", request);
  });

  it("sends Product Credit version fields without Dust fields", async () => {
    const request = {
      effectiveFrom: "2026-11-10T00:00:00Z",
      effectiveTo: null,
      defaultRepaymentPeriodDays: 30,
      maximumProductCreditExtensions: null,
      notes: "Optional",
    };
    vi.mocked(api.post).mockResolvedValue({ data: { id: "version-1" } });

    await repaymentRulesService.createRepaymentRuleVersion("rule-1", request);

    expect(api.post).toHaveBeenCalledWith(
      "/repayment-rules/rule-1/versions",
      request,
    );
    expect(request).not.toHaveProperty("maximumExtensions");
    expect(request).not.toHaveProperty("debtRepaymentPercent");
  });

  it("sends Dust version fields without Product Credit extension fields", async () => {
    const request = {
      effectiveFrom: "2026-11-10T00:00:00Z",
      effectiveTo: null,
      defaultRepaymentPeriodDays: 30,
      debtRepaymentPercent: 60,
      agentPayoutPercent: 40,
      excessBusinessPercent: 50,
      excessAgentPercent: 50,
      maximumExtensions: 2,
      notes: "Optional",
    };
    vi.mocked(api.post).mockResolvedValue({ data: { id: "version-1" } });

    await repaymentRulesService.createRepaymentRuleVersion("rule-1", request);

    expect(api.post).toHaveBeenCalledWith(
      "/repayment-rules/rule-1/versions",
      request,
    );
    expect(request).not.toHaveProperty("maximumProductCreditExtensions");
  });
});
