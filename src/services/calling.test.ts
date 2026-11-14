import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/index", () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
  };
  return { api, default: api };
});

vi.mock("@/utils", () => ({
  getCashRegisterId: () => 6,
  getHeaders: (cashRegisterId?: number) => ({
    ...(cashRegisterId ? { "X-CashRegister-Id": String(cashRegisterId) } : {}),
  }),
}));

import { api } from "@/services/index";
import { callingService } from "./calling";

describe("callingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts a call without a request body", async () => {
    const response = { callId: "call-1", status: "Ringing", startedAt: "2026-11-12T10:00:00Z" };
    vi.mocked(api.post).mockResolvedValue({ data: response });

    await expect(callingService.startCall()).resolves.toEqual(response);
    expect(api.post).toHaveBeenCalledWith("/calls", undefined, {
      headers: { "X-CashRegister-Id": "6" },
    });
  });

  it("accepts, rejects, and ends calls using their REST routes", async () => {
    const accepted = {
      callId: "call/one",
      status: "Accepted",
      assignedCashierId: 17,
      acceptedAt: "2026-11-12T10:00:04Z",
    };
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: accepted, status: 200 })
      .mockResolvedValue({ data: undefined });

    await expect(callingService.acceptCall("call/one")).resolves.toEqual({
      data: accepted,
      httpStatus: 200,
    });
    await callingService.rejectCall("call/one");
    await callingService.endCall("call/one");

    const config = { headers: { "X-CashRegister-Id": "6" } };
    expect(api.post).toHaveBeenNthCalledWith(1, "/calls/call%2Fone/accept", undefined, config);
    expect(api.post).toHaveBeenNthCalledWith(2, "/calls/call%2Fone/reject", undefined, config);
    expect(api.post).toHaveBeenNthCalledWith(3, "/calls/call%2Fone/end", undefined, config);
  });

  it("loads call details, paginated history, and configured ICE servers", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { callId: "call-1" } })
      .mockResolvedValueOnce({ data: { items: [], page: 2, pageSize: 10, totalItems: 0 } })
      .mockResolvedValueOnce({ data: { iceServers: [] } });

    await callingService.getCall("call/one");
    await callingService.getHistory(2, 10);
    await callingService.getIceServers();

    const config = { headers: { "X-CashRegister-Id": "6" } };
    expect(api.get).toHaveBeenNthCalledWith(1, "/calls/call%2Fone", config);
    expect(api.get).toHaveBeenNthCalledWith(2, "/calls/history", {
      ...config,
      params: { page: 2, pageSize: 10 },
    });
    expect(api.get).toHaveBeenNthCalledWith(3, "/calls/ice-servers", config);
  });
});
