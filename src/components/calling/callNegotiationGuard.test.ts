import { describe, expect, it } from "vitest";
import { CallNegotiationGuard } from "./callNegotiationGuard";

describe("CallNegotiationGuard", () => {
  it("allows only one Offer per call, including after a failed attempt", () => {
    const guard = new CallNegotiationGuard();

    expect(guard.claimOffer("call-1")).toBe(true);
    expect(guard.claimOffer("call-1")).toBe(false);
    expect(guard.claimOffer("call-2")).toBe(true);
  });

  it("allows only one Answer per call and resets when a call ends", () => {
    const guard = new CallNegotiationGuard();

    expect(guard.claimAnswer("call-1")).toBe(true);
    expect(guard.claimAnswer("call-1")).toBe(false);
    guard.clear();
    expect(guard.claimAnswer("call-1")).toBe(true);
  });
});
