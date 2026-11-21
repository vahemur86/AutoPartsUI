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
      packages: [
        { sealNumber: "IRON-12", powderKg: 3.125 },
        { sealNumber: "IRON-13", powderKg: 2.875 },
      ],
    };
    vi.mocked(api.post).mockResolvedValue({ data: [{ id: 17 }, { id: 18 }] });

    await powderPackagesService.createIron(request);

    expect(api.post).toHaveBeenCalledWith("/admin/iron-shop/powder-packages", request);
  });

  it("creates a batch of catalyst packages in one request", async () => {
    const request = {
      powderBatchId: 123,
      packages: [
        { sealNumber: "N165", powderKg: 3 },
        { sealNumber: "N166", powderKg: 3 },
      ],
    };
    vi.mocked(api.post).mockResolvedValue({ data: [{ id: 20 }, { id: 21 }] });

    await powderPackagesService.create(request);

    expect(api.post).toHaveBeenCalledWith("/admin/powder-packages", request);
  });

  it("invalidates a ready or cancelled package", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 17, status: 4 } });

    await powderPackagesService.invalidate(17);

    expect(api.post).toHaveBeenCalledWith("/admin/powder-packages/17/invalidate");
  });
});
