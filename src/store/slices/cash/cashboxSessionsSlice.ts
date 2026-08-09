import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getBatches,
  getBatch,
  getBatchDetails,
  getSessionBatches,
  getZReports,
  getZReport,
  getCashboxReport,
  closeCashRegisterSession,
} from "@/services/settings/cash/cashboxSessions";

// types
import type {
  Batch,
  BatchDetails,
  BatchResponse,
  SessionBatchDetails,
  CloseSessionResult,
  ZReport,
  ZReportResponse,
  PaginatedResponse,
  CashboxReport,
} from "@/types/cash";

// utils
import { getApiErrorMessage } from "@/utils";

interface CashReportsState {
  batches: BatchResponse | null;
  batch: BatchDetails | null;
  /**
   * All batches of a session with their items. Prevent-merge
   * (special-customer) items are isolated into separate batches,
   * so a session can have more than one batch.
   */
  batchDetails: SessionBatchDetails | null;
  sessionBatches: Batch[] | null;
  closeSessionResult: CloseSessionResult | null;
  zReports: PaginatedResponse<ZReport> | null;
  selectedZReport: ZReport | null;
  cashboxReport: CashboxReport | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CashReportsState = {
  batches: null,
  batch: null,
  batchDetails: null,
  sessionBatches: null,
  closeSessionResult: null,
  zReports: null,
  selectedZReport: null,
  cashboxReport: null,
  isLoading: false,
  error: null,
};

// --- Async Thunks ---

export const closeSession = createAsyncThunk<
  CloseSessionResult,
  { sessionId: number; cashRegisterId: number },
  { rejectValue: string }
>("cashReports/closeSession", async (params, { rejectWithValue }) => {
  try {
    return await closeCashRegisterSession(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to close session"),
    );
  }
});

export const fetchBatches = createAsyncThunk<
  BatchResponse,
  Parameters<typeof getBatches>[0],
  { rejectValue: string }
>("cashReports/fetchBatches", async (params, { rejectWithValue }) => {
  try {
    return await getBatches(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch batches"),
    );
  }
});

export const fetchBatch = createAsyncThunk<
  BatchDetails,
  { batchId: number; cashRegisterId?: number },
  { rejectValue: string }
>("cashReports/fetchBatch", async (params, { rejectWithValue }) => {
  try {
    return await getBatch(params);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch batch"));
  }
});

export const fetchSessionBatches = createAsyncThunk<
  Batch[],
  { sessionId: number; cashRegisterId?: number },
  { rejectValue: string }
>("cashReports/fetchSessionBatches", async (params, { rejectWithValue }) => {
  try {
    return await getSessionBatches(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch session batches"),
    );
  }
});

export const fetchBatchDetails = createAsyncThunk<
  SessionBatchDetails,
  { sessionId: number; cashRegisterId?: number; supplierClientId?: number },
  { rejectValue: string }
>("cashReports/fetchBatchDetails", async (params, { rejectWithValue }) => {
  try {
    return await getBatchDetails(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch batch details"),
    );
  }
});

export const fetchZReports = createAsyncThunk<
  ZReportResponse,
  Parameters<typeof getZReports>[0],
  { rejectValue: string }
>("cashReports/fetchZReports", async (params, { rejectWithValue }) => {
  try {
    return await getZReports(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch Z-Reports"),
    );
  }
});

export const fetchZReport = createAsyncThunk<
  ZReport,
  { sessionId: number; cashRegisterId?: number },
  { rejectValue: string }
>("cashReports/fetchZReport", async (params, { rejectWithValue }) => {
  try {
    return await getZReport(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch Z-Report"),
    );
  }
});

export const fetchCashboxReport = createAsyncThunk<
  CashboxReport,
  Parameters<typeof getCashboxReport>[0],
  { rejectValue: string }
>("cashReports/fetchCashboxReport", async (params, { rejectWithValue }) => {
  try {
    return await getCashboxReport(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch cashbox report"),
    );
  }
});

// --- Slice ---

const cashReportsSlice = createSlice({
  name: "cashReports",
  initialState,
  reducers: {
    clearSelection: (state) => {
      state.batch = null;
      state.batchDetails = null;
      state.sessionBatches = null;
      state.selectedZReport = null;
      state.cashboxReport = null;
    },
    resetReportsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(closeSession.fulfilled, (state, action) => {
        state.isLoading = false;
        Object.assign(state, initialState);
        state.closeSessionResult = action.payload;
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.batches = action.payload;
      })
      .addCase(fetchBatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.batch = action.payload;
      })
      .addCase(fetchSessionBatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionBatches = action.payload;
      })
      .addCase(fetchBatchDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.batchDetails = action.payload;
      })
      .addCase(fetchZReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.zReports = action.payload;
      })
      .addCase(fetchZReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedZReport = action.payload;
      })
      .addCase(fetchCashboxReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cashboxReport = action.payload;
      })

      // Global Matchers for Loading and Error states
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        // Added PayloadAction<string> to the matcher to fix the error you saw
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.error = action.payload ?? "An unexpected error occurred";
        },
      );
  },
});

export const { clearSelection, resetReportsState } = cashReportsSlice.actions;
export default cashReportsSlice.reducer;
