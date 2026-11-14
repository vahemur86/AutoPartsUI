import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./index", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("@/utils", () => ({
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

import api from "./index";
import { getCashFundsReport } from "./financeReports";

describe("cash funds report API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests the all-register report without query filters", async () => {
    const report = { registers: [], totalCashBalanceAmd: 0 };
    vi.mocked(api.get).mockResolvedValue({ data: report });

    await getCashFundsReport();

    expect(api.get).toHaveBeenCalledWith("/admin/cash-funds/report");
  });

  it("includes only selected optional filters", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { registers: [] } });

    await getCashFundsReport({ shopId: 3, cashRegisterId: 8 });

    expect(api.get).toHaveBeenCalledWith(
      "/admin/cash-funds/report?shopId=3&cashRegisterId=8",
    );
  });

  it("omits a cash register filter when only a shop was selected", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { registers: [] } });

    await getCashFundsReport({ shopId: 3 });

    expect(api.get).toHaveBeenCalledWith("/admin/cash-funds/report?shopId=3");
  });

  it("rejects invalid filter ids without making a request", async () => {
    await expect(getCashFundsReport({ shopId: 1.5 })).rejects.toThrow(
      "shopId must be a positive integer.",
    );
    expect(api.get).not.toHaveBeenCalled();
  });
});
