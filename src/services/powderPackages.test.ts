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
import { powderPackagesService } from "./powderPackages";

describe("powder packages API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads iron source batches for the selected warehouse", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await powderPackagesService.listIronSourceBatches(8);

    expect(api.get).toHaveBeenCalledWith(
      "/admin/iron-shop/powder-packages/source-batches",
      { params: { warehouseId: 8 } },
    );
  });

  it("creates an iron powder package with its processing batch, seal, and weight", async () => {
    const request = {
      ironProcessingBatchId: 321,
      sealNumber: "IRON-12",
      powderKg: 3.125,
    };
    vi.mocked(api.post).mockResolvedValue({ data: { id: 17 } });

    await powderPackagesService.createIron(request);

    expect(api.post).toHaveBeenCalledWith("/admin/iron-shop/powder-packages", request);
  });
});
