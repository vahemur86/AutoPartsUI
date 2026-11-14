import { describe, expect, it } from "vitest";
import { getUserIdFromToken } from "./userIdFromToken";

const makeToken = (claims: Record<string, unknown>) => {
  const payload = btoa(JSON.stringify(claims))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `header.${payload}.signature`;
};

describe("getUserIdFromToken", () => {
  it("reads a numeric user id from the JWT subject without exposing the token", () => {
    expect(getUserIdFromToken(makeToken({ sub: "62", role: "Cashier" }))).toBe(62);
  });

  it("returns null for an absent or invalid user id", () => {
    expect(getUserIdFromToken(null)).toBeNull();
    expect(getUserIdFromToken("not-a-token")).toBeNull();
    expect(getUserIdFromToken(makeToken({ sub: "cashier" }))).toBeNull();
  });
});
