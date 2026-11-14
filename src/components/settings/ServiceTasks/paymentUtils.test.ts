import { describe, expect, it } from "vitest";
import { toExclusiveDate } from "./paymentUtils";

describe("toExclusiveDate", () => {
  it("moves an inclusive end date forward by one calendar day", () => {
    expect(toExclusiveDate("2026-11-30")).toBe("2026-12-01");
  });

  it("handles leap days and empty values", () => {
    expect(toExclusiveDate("2024-02-28")).toBe("2024-02-29");
    expect(toExclusiveDate("")).toBeUndefined();
  });
});
