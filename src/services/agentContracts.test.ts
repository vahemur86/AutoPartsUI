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
    }, 9);

    expect(api.get).toHaveBeenCalledWith("/agent-contracts", {
      params: {
        agentId: "agent-2",
        status: "Active",
        page: 1,
        pageSize: 50,
        allowsProductAdvance: true,
      },
      headers: { "X-CashRegister-Id": "9" },
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

  it("loads eligible Product Credit contracts for an agent and shop with the cash register header", async () => {
    const contracts = [{ contractId: "contract-1", contractNumber: "PC-001" }];
    vi.mocked(api.get).mockResolvedValue({ data: contracts });

    const result = await agentContractsService.getShopProductCreditContracts("agent/1", 6, 9);

    expect(api.get).toHaveBeenCalledWith(
      "/agent-contracts/agents/agent%2F1/shops/6/product-credit",
      { headers: { "X-CashRegister-Id": "9" } },
    );
    expect(result).toEqual(contracts);
  });

  it("updates Product Credit terms on the selected contract", async () => {
    const terms = {
      creditLimitAmd: 500000,
      discountPercent: 5,
      restoreCreditLimitAfterRepayment: true,
      acceptsNewPurchases: true,
    };
    vi.mocked(api.put).mockResolvedValue({ data: undefined });

    await agentContractsService.updateProductCreditTerms("contract-1", terms);

    expect(api.put).toHaveBeenCalledWith("/agent-contracts/contract-1/product-credit-terms", terms);
  });

  it("submits a reasoned Product Credit deadline extension", async () => {
    const extension = { newDeadline: "2027-01-31T23:59:59.000Z", reason: "Approved extension" };
    vi.mocked(api.post).mockResolvedValue({ data: undefined });

    await agentContractsService.extendProductCreditDeadline("contract-1", extension);

    expect(api.post).toHaveBeenCalledWith(
      "/agent-contracts/contract-1/product-credit-deadline/extensions",
      extension,
    );
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

  it("creates a fully funded cash advance in one request", async () => {
    const request = {
      amount: 500000,
      advanceDate: "2026-11-10T10:00:00.000Z",
      notes: "Working capital",
      allocations: [
        { capitalSourceId: "source-1", amount: 300000, description: "Bank funds" },
        { capitalSourceId: "source-2", amount: 200000, description: "Owner funds" },
      ],
    };
    vi.mocked(api.post).mockResolvedValue({ data: "advance-1" });

    const result = await agentContractsService.createAdvance("contract-1", request);

    expect(api.post).toHaveBeenCalledWith("/agent-contracts/contract-1/advances", request);
    expect(result).toBe("advance-1");
  });

  it("approves an advance using the explicit approval endpoint", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: undefined });

    await agentContractsService.approveAdvance("advance-1");

    expect(api.post).toHaveBeenCalledWith("/agent-advances/advance-1/approve");
  });
});
