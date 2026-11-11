import { describe, expect, it } from "vitest";
import { isProductCreditContract } from "./agentContracts";

describe("isProductCreditContract", () => {
  it("recognizes contracts explicitly enabled for product credit", () => {
    expect(isProductCreditContract({
      allowsProductAdvance: true,
      repaymentTerms: undefined,
    })).toBe(true);
  });

  it("uses the repayment rule type when the permission flag is absent or false", () => {
    expect(isProductCreditContract({
      allowsProductAdvance: false,
      repaymentTerms: { type: "ProductCredit" },
    })).toBe(true);
    expect(isProductCreditContract({
      allowsProductAdvance: undefined,
      repaymentTerms: { type: "ProductCredit" },
    })).toBe(true);
  });

  it("keeps Dust contracts in the cash-powder flow", () => {
    expect(isProductCreditContract({
      allowsProductAdvance: false,
      repaymentTerms: { type: "Dust" },
    })).toBe(false);
  });
});
