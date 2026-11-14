import { describe, expect, it } from "vitest";
import { isValidCallAcceptance } from "./callAcceptance";

describe("isValidCallAcceptance", () => {
  const response = {
    callId: "call-1",
    status: "Accepted" as const,
    assignedCashierId: 62,
    acceptedAt: "2026-11-13T17:00:00Z",
  };

  it("accepts a successful response for the requested call", () => {
    expect(isValidCallAcceptance(response, "call-1", 62, 200)).toBe(true);
  });

  it("rejects a response for another call, another cashier, or without a valid cashier id", () => {
    expect(isValidCallAcceptance({ ...response, callId: "call-2" }, "call-1", 62, 200)).toBe(false);
    expect(isValidCallAcceptance(response, "call-1", 63, 200)).toBe(false);
    expect(isValidCallAcceptance(response, "call-1", null, 200)).toBe(false);
    expect(isValidCallAcceptance({ ...response, assignedCashierId: 0 }, "call-1", 62, 200)).toBe(false);
    expect(isValidCallAcceptance(response, "call-1", 62, 409)).toBe(false);
  });
});
