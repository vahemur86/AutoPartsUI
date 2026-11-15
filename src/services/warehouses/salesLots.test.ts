import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/utils", () => ({
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

import api from "@/services";
import {
  createSalesLot,
  getSalesLots,
  previewSalesLot,
} from "./salesLots";

describe("sales lots API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the seal number in the create request body", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: 159 });

    await createSalesLot({
      warehouseId: 8,
      sealNumber: "N165",
      items: [
        { inventoryLotId: 159, powderKg: 1 },
        { inventoryLotId: 160, powderKg: 2 },
      ],
      cashRegisterId: 5,
    });

    expect(api.post).toHaveBeenCalledWith(
      "/admin/sales-lots",
      {
        warehouseId: 8,
        sealNumber: "N165",
        items: [
          { inventoryLotId: 159, powderKg: 1 },
          { inventoryLotId: 160, powderKg: 2 },
        ],
      },
      { headers: { "X-CashRegister-Id": 5 } },
    );
  });

  it("sends a selected seal number as a list filter", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { results: [] } });

    await getSalesLots({
      warehouseId: 8,
      sealNumber: "N165",
      cashRegisterId: 5,
    });

    expect(api.get).toHaveBeenCalledWith("/admin/sales-lots", {
      params: { warehouseId: 8, sealNumber: "N165" },
      headers: { "X-CashRegister-Id": 5 },
    });
  });

  it("does not send a seal number when requesting the preview", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { items: [] } });
    const items = [
      { inventoryLotId: 159, powderKg: 1 },
      { inventoryLotId: 160, powderKg: 2 },
    ];

    await previewSalesLot({
      warehouseId: 8,
      items,
      cashRegisterId: 5,
    });

    expect(api.post).toHaveBeenCalledWith(
      "/admin/sales-lots/preview",
      { warehouseId: 8, items },
      { headers: { "X-CashRegister-Id": 5 } },
    );
  });
});
