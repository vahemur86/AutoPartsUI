import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/index", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "@/services/index";
import { agentContractsService } from "./agentContracts";

describe("agentContractsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads powder contracts with allowsProductAdvance=false and keeps pagination and filters", async () => {
    const payload = { totalItems: 1, page: 1, pageSize: 50, results: [] };
    vi.mocked(api.get).mockResolvedValue({ data: payload });

    const result = await agentContractsService.listPowderContracts({
      agentId: "agent-1",
      status: "Active",
      contractNumber: "C-001",
      contractDateFrom: "2026-01-01",
      contractDateTo: "2026-01-31",
      page: 1,
      pageSize: 50,
    });

    expect(api.get).toHaveBeenCalledWith("/agent-contracts", {
      params: {
        agentId: "agent-1",
        status: "Active",
        contractNumber: "C-001",
        contractDateFrom: "2026-01-01",
        contractDateTo: "2026-01-31",
        page: 1,
        pageSize: 50,
        allowsProductAdvance: false,
      },
      headers: expect.objectContaining({ "X-CashRegister-Id": expect.any(String) }),
    });
    expect(result).toEqual(payload);
  });

  it("loads product-credit contracts with allowsProductAdvance=true and keeps pagination and filters", async () => {
    const payload = { totalItems: 1, page: 1, pageSize: 50, results: [] };
    vi.mocked(api.get).mockResolvedValue({ data: payload });

    const result = await agentContractsService.listProductCreditContracts({
      agentId: "agent-2",
      status: "Active",
      page: 1,
      pageSize: 50,
    });

    expect(api.get).toHaveBeenCalledWith("/agent-contracts", {
      params: {
        agentId: "agent-2",
        status: "Active",
        page: 1,
        pageSize: 50,
        allowsProductAdvance: true,
      },
      headers: expect.objectContaining({ "X-CashRegister-Id": expect.any(String) }),
    });
    expect(result).toEqual(payload);
  });

  it("leaves intentionally mixed contract calls unfiltered when no product advance filter is requested", async () => {
    const payload = { totalItems: 2, page: 1, pageSize: 10, results: [] };
    vi.mocked(api.get).mockResolvedValue({ data: payload });

    const result = await agentContractsService.listContracts({
      page: 1,
      pageSize: 10,
      status: "Active",
    });

    expect(api.get).toHaveBeenCalledWith("/agent-contracts", {
      params: {
        page: 1,
        pageSize: 10,
        status: "Active",
      },
      headers: expect.objectContaining({ "X-CashRegister-Id": expect.any(String) }),
    });
    expect(result).toEqual(payload);
  });

  it("activates a product advance contract with the expected endpoint", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: undefined });

    await agentContractsService.activateProductAdvanceContract("contract-1");

    expect(api.post).toHaveBeenCalledWith("/agent-contracts/contract-1/activate-product");
  });

  it("deactivates a product advance contract with the expected endpoint", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: undefined });

    await agentContractsService.deactivateProductAdvanceContract("contract-2");

    expect(api.post).toHaveBeenCalledWith("/agent-contracts/contract-2/deactivate-product");
  });

  it("loads advances filtered by product-credit contract eligibility", async () => {
    const payload = { totalItems: 0, page: 1, pageSize: 500, results: [] };
    vi.mocked(api.get).mockResolvedValue({ data: payload });

    const result = await agentContractsService.listAdvances({
      page: 1,
      pageSize: 500,
      allowsProductAdvance: true,
    });

    expect(api.get).toHaveBeenCalledWith("/agent-advances", {
      params: { page: 1, pageSize: 500, allowsProductAdvance: true },
    });
    expect(result).toEqual(payload);
  });
});
