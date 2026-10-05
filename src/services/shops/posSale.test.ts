import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/services", () => ({
  default: { post: vi.fn() },
}));

import api from "@/services";
import { createPOSSale } from "./posSale";

describe("createPOSSale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends Agent Credit Sale fields when the cashier identifies an agent", async () => {
    const mockPost = vi.mocked(api.post);
    mockPost.mockResolvedValue({ data: { id: 7, totalAmount: 25000 } });

    await createPOSSale(
      {
        shopId: 2,
        customerId: 13,
        isAgentCredit: true,
        agentId: "agent-42",
        agentContractId: "contract-9",
        cashPaid: 0,
        nonCashPaid: 0,
        items: [{ productId: 1, shopStockId: 10, quantity: 2, unitPrice: 12500 }],
      },
      88,
    );

    expect(api.post).toHaveBeenCalledWith(
      "/POSSale",
      {
        shopId: 2,
        customerId: 13,
        isAgentCredit: true,
        agentId: "agent-42",
        agentContractId: "contract-9",
        cashPaid: 0,
        nonCashPaid: 0,
        items: [{ productId: 1, shopStockId: 10, quantity: 2, unitPrice: 12500 }],
      },
      expect.objectContaining({
        headers: expect.objectContaining({}),
      }),
    );
  });
});
