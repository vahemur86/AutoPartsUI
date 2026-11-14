import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./index", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/utils", () => ({
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

import api from "./index";
import {
  createOtherExpensePayment,
  getOtherExpensePayments,
  getOtherExpensePaymentsReport,
} from "./otherExpenses";
import { OtherExpensePaymentMethod } from "../types/otherExpenses";

describe("other expense payments API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a single payment using the submitted cash and non-cash portions", async () => {
    const payload = {
      cashAmount: 6000,
      cashRegisterId: 8,
      nonCashAmount: 4000,
      comment: "Utility bill",
    };
    vi.mocked(api.post).mockResolvedValue({ data: { id: 61 } });

    await createOtherExpensePayment(12, payload);

    expect(api.post).toHaveBeenCalledWith(
      "/admin/other-expenses/12/payments",
      payload,
    );
  });

  it("records non-cash payments without a non-cash register field", async () => {
    const payload = {
      cashAmount: 0,
      cashRegisterId: null,
      nonCashAmount: 10000,
      comment: "Electricity bill",
    };
    vi.mocked(api.post).mockResolvedValue({ data: { id: 62 } });

    await createOtherExpensePayment(12, payload);

    expect(api.post).toHaveBeenCalledWith(
      "/admin/other-expenses/12/payments",
      payload,
    );
    expect(payload).not.toHaveProperty("nonCashRegisterId");
  });

  it("requests one service's payment history with paging and filters", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { payments: [] } });
    const filters = {
      fromDate: "2026-11-01",
      toDate: "2026-12-01",
      cashRegisterId: 8,
      method: OtherExpensePaymentMethod.Cash,
      page: 2,
      pageSize: 50,
    };

    await getOtherExpensePayments(12, filters);

    expect(api.get).toHaveBeenCalledWith(
      "/admin/other-expenses/12/payments",
      { params: filters },
    );
  });

  it("requests the cross-service report with optional filters", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { payments: [] } });

    await getOtherExpensePaymentsReport({
      locationId: 3,
      locationType: 1,
      method: OtherExpensePaymentMethod.NonCash,
    });

    expect(api.get).toHaveBeenCalledWith(
      "/admin/other-expenses/payments",
      {
        params: {
          locationId: 3,
          locationType: 1,
          method: OtherExpensePaymentMethod.NonCash,
          page: 1,
          pageSize: 50,
        },
      },
    );
  });
});
