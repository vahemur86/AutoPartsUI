import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/index", () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { api, default: api };
});

import { api } from "@/services/index";
import { sendUserPasswordReset, updateUser } from "./users";

describe("user password reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests a password reset for the specified user", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: undefined });

    await sendUserPasswordReset(42);

    expect(api.post).toHaveBeenCalledWith("/Users/42/password-reset");
  });

  it("surfaces API errors when the password reset request fails", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { data: { message: "Email delivery failed" } },
    });

    await expect(sendUserPasswordReset(42)).rejects.toThrow(
      "Email delivery failed",
    );
  });

  it("does not include a password in an ordinary user update", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: undefined });

    await updateUser({
      id: 42,
      role: "Operator",
      userType: "Shop",
      shopId: 6,
      warehouseId: null,
      isActive: true,
    });

    expect(api.put).toHaveBeenCalledWith("/Users/42", {
      role: "Operator",
      userType: "Shop",
      shopId: 6,
      warehouseId: null,
      isActive: true,
    });
  });
});
