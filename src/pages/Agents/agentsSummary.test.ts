import { describe, expect, it } from "vitest";

import { getAgentSummaryCounts } from "./agentSummary";

describe("getAgentSummaryCounts", () => {
  it("keeps inactive as total minus active count", () => {
    expect(getAgentSummaryCounts(5, 3)).toEqual({
      total: 5,
      active: 3,
      inactive: 2,
    });
  });
});
