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
  ZReport,
  ZReportResponse,
  PaginatedResponse,
  CashboxReport,
} from "@/types/cash";

// utils
import { getApiErrorMessage } from "@/utils";

interface CashReportsState {
  batches: PaginatedResponse<Batch> | null;
  batch: Batch | null;
  batchDetails: BatchDetails | null;
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
  zReports: null,
  selectedZReport: null,
  cashboxReport: null,
  isLoading: false,
  error: null,
};

// --- Async Thunks ---

export const closeSession = createAsyncThunk<
  void,
  { sessionId: number; cashRegisterId: number },
  { rejectValue: string }
>("cashReports/closeSession", async (params, { rejectWithValue }) => {
  try {
    await closeCashRegisterSession(params);
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
  Batch,
  { sessionId: number; cashRegisterId: number },
  { rejectValue: string }
>("cashReports/fetchBatch", async (params, { rejectWithValue }) => {
  try {
    return await getBatch(params);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch batch"));
  }
});

export const fetchBatchDetails = createAsyncThunk<
  BatchDetails,
  { sessionId: number; cashRegisterId: number },
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
  { sessionId: number; cashRegisterId: number },
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
      state.selectedZReport = null;
      state.cashboxReport = null;
    },
    resetReportsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(closeSession.fulfilled, (state) => {
        state.isLoading = false;
        Object.assign(state, initialState);
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.batches = action.payload;
      })
      .addCase(fetchBatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.batch = action.payload;
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
