import { describe, expect, it, vi } from "vitest";
import type { BatchDetailsForFilter } from "@/types/cash";
import dashboardReducer, { fetchBatchDetailsForFilter } from "./dashboardSlice";

vi.mock("@/services/settings/cash/dashboard", () => ({
  getBatchDetailsForFilter: vi.fn(),
  getOpenSessions: vi.fn(),
  getOpenSessionsSummary: vi.fn(),
  getPowderBatches: vi.fn(),
  getPowderBatchesSummary: vi.fn(),
  getPowderBatchesSummaryByDate: vi.fn(),
}));

vi.mock("@/utils", () => ({
  getApiErrorMessage: vi.fn(),
}));


const emptyBatchDetails: BatchDetailsForFilter = {
  totalItems: 0,
  page: 1,
  pageSize: 10,
  totalPowderKg: 0,
  totalCostAmd: 0,
  avgPtPerKg_g: 0,
  avgPdPerKg_g: 0,
  avgRhPerKg_g: 0,
  items: [],
};

describe("batch details filter loading state", () => {
  it("finishes loading when the request succeeds with no results", () => {
    const requestId = "batch-details-empty";
    const params = { clientPhone: "+37412345678" };
    const loadingState = dashboardReducer(
      undefined,
      fetchBatchDetailsForFilter.pending(requestId, params),
    );

    expect(loadingState.isBatchDetailsForFilterLoading).toBe(true);

    const completedState = dashboardReducer(
      loadingState,
      fetchBatchDetailsForFilter.fulfilled(
        emptyBatchDetails,
        requestId,
        params,
      ),
    );

    expect(completedState.isBatchDetailsForFilterLoading).toBe(false);
    expect(completedState.batchDetailsForFilter?.items).toEqual([]);
  });

  it("finishes loading when the request fails", () => {
    const requestId = "batch-details-failed";
    const failedState = dashboardReducer(
      dashboardReducer(
        undefined,
        fetchBatchDetailsForFilter.pending(requestId, {}),
      ),
      fetchBatchDetailsForFilter.rejected(null, requestId, {}, "request failed"),
    );

    expect(failedState.isBatchDetailsForFilterLoading).toBe(false);
  });
});
