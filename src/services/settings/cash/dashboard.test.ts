import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("@/utils", () => ({
  getApiErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  getHeaders: vi.fn((cashRegisterId?: number) => (
    cashRegisterId ? { "X-CashRegister-Id": String(cashRegisterId) } : {}
  )),
}));

import api from "@/services";
import { getBatchDetailsForFilter } from "./dashboard";

describe("getBatchDetailsForFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("omits an unspecified cash register and trims name and phone filters", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { results: [] } });

    await getBatchDetailsForFilter({
      clientName: "  Simon Hakobyan  ",
      clientPhone: "  +37477258565  ",
    });

    expect(api.get).toHaveBeenCalledWith(
      "/cashbox-sessions/batch-details",
      expect.objectContaining({
        params: expect.objectContaining({
          clientName: "Simon Hakobyan",
          clientPhone: "+37477258565",
          page: 1,
          pageSize: 50,
        }),
        headers: {},
      }),
    );
    const requestConfig = vi.mocked(api.get).mock.calls[0][1];
    expect(requestConfig?.params).not.toHaveProperty("cashRegisterId");
  });

  it("includes the cash register only when explicitly provided", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { results: [] } });

    await getBatchDetailsForFilter({ cashRegisterId: 7 });

    const requestConfig = vi.mocked(api.get).mock.calls[0][1];
    expect(requestConfig?.params).toHaveProperty("cashRegisterId", 7);
  });
});
