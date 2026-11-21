import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils", () => ({
  getHeaders: (id?: number) => id ? { "X-CashRegister-Id": String(id) } : {},
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

vi.mock("@/services", () => ({
  default: { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import api from "@/services";
import {
  confirmProductReturnItemLoss,
  createProductReturn,
  getProductReturns,
  inspectProductReturnItem,
} from "./productReturns";
import {
  deleteProductImage,
  getProductImage,
  replaceProductImage,
  uploadProductImage,
  validateProductImage,
} from "./productImages";

describe("product return service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a sale-item return at the documented route and preserves the request key", async () => {
    const response = {
      id: 21,
      posSaleId: 7,
      shopId: 2,
      cashRegisterId: 9,
      cashSessionId: 10,
      reason: "Wrong part",
      createdBy: "cashier",
      createdAt: "2026-10-12T10:00:00Z",
      totalRefundAmountAmd: 1250,
      cashRefundAmountAmd: 1250,
      nonCashRefundAmountAmd: 0,
      items: [],
    };
    vi.mocked(api.post).mockResolvedValue({ data: response });
    const request = {
      idempotencyKey: "return-key",
      reason: "Wrong part",
      items: [{ posSaleItemId: 55, quantity: 1, condition: 3 as const }],
    };

    await expect(createProductReturn(7, request, 9)).resolves.toBe(response);

    expect(api.post).toHaveBeenCalledWith(
      "/pos/sales/7/returns",
      request,
      { headers: { "X-CashRegister-Id": "9" } },
    );
  });

  it("loads return history for the original sale", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await getProductReturns(7, 9);

    expect(api.get).toHaveBeenCalledWith("/pos/sales/7/returns", {
      headers: { "X-CashRegister-Id": "9" },
    });
  });

  it("inspects and confirms loss for a specific returned item", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: undefined });

    await inspectProductReturnItem(21, 33, { condition: 2 });
    await confirmProductReturnItemLoss(21, 33, { notes: "Broken" });

    expect(api.post).toHaveBeenNthCalledWith(
      1,
      "/pos/returns/21/items/33/inspection",
      { condition: 2 },
    );
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      "/pos/returns/21/items/33/loss-confirmation",
      { notes: "Broken" },
    );
  });
});

describe("product image service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uploads and replaces images through the same POST endpoint", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: undefined });
    const file = new File(["image"], "part.webp", { type: "image/webp" });

    await uploadProductImage(4, file);
    await replaceProductImage(4, file);

    expect(api.post).toHaveBeenNthCalledWith(
      1,
      "/products/4/image",
      expect.any(FormData),
      expect.objectContaining({
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: expect.any(Function),
      }),
    );
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      "/products/4/image",
      expect.any(FormData),
      expect.any(Object),
    );
    expect(api.put).not.toHaveBeenCalled();
  });

  it("deletes an image using the documented endpoint", async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 204 });

    await deleteProductImage(4);

    expect(api.delete).toHaveBeenCalledWith("/products/4/image");
  });

  it("reads product image bytes through the authenticated API client", async () => {
    const bytes = new Blob(["image"], { type: "image/png" });
    vi.mocked(api.get).mockResolvedValue({ data: bytes });

    await expect(getProductImage(4)).resolves.toBe(bytes);

    expect(api.get).toHaveBeenCalledWith("/products/4/image", {
      responseType: "blob",
    });
  });

  it("accepts JPEG, PNG, and WebP up to 5 MB", () => {
    expect(validateProductImage(new File(["jpg"], "part.jpg", { type: "image/jpeg" }))).toBeNull();
    expect(validateProductImage(new File(["png"], "part.png", { type: "image/png" }))).toBeNull();
    expect(validateProductImage(new File(["webp"], "part.webp", { type: "image/webp" }))).toBeNull();
    expect(validateProductImage(new File(["gif"], "part.gif", { type: "image/gif" }))).toBe("unsupported-type");
    expect(validateProductImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }))).toBe("file-too-large");
  });
});
