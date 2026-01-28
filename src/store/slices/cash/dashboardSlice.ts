import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getOpenSessions,
  getOpenSessionsSummary,
  getPowderBatches,
  getPowderBatchesSummary,
} from "@/services/settings/cash/dashboard";

// types
import type {
  OpenSession,
  OpenSessionSummary,
  PowderBatch,
  PowderBatchResponse,
  PowderBatchesSummary,
} from "@/types/cash";

// utils
import { getApiErrorMessage } from "@/utils";

interface CashDashboardState {
  openSessions: OpenSession[];
  openSessionsSummary: OpenSessionSummary[];
  powderBatches: PowderBatchResponse | null;
  selectedPowderBatch: PowderBatch | null;
  powderBatchesSummary: PowderBatchesSummary | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CashDashboardState = {
  openSessions: [],
  openSessionsSummary: [],
  powderBatches: null,
  selectedPowderBatch: null,
  powderBatchesSummary: null,
  isLoading: false,
  error: null,
};

// --- Async Thunks ---

export const fetchOpenSessions = createAsyncThunk<
  OpenSession[],
  Parameters<typeof getOpenSessions>[0],
  { rejectValue: string }
>("cashDashboard/fetchOpenSessions", async (params, { rejectWithValue }) => {
  try {
    return await getOpenSessions(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch open sessions"),
    );
  }
});

export const fetchOpenSessionsSummary = createAsyncThunk<
  OpenSessionSummary[],
  { shopId?: number; cashRegisterId?: number },
  { rejectValue: string }
>(
  "cashDashboard/fetchOpenSessionsSummary",
  async (params, { rejectWithValue }) => {
    try {
      return await getOpenSessionsSummary(params);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch sessions summary"),
      );
    }
  },
);

export const fetchPowderBatches = createAsyncThunk<
  PowderBatchResponse,
  Parameters<typeof getPowderBatches>[0],
  { rejectValue: string }
>("cashDashboard/fetchPowderBatches", async (params, { rejectWithValue }) => {
  try {
    return await getPowderBatches(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch powder batches"),
    );
  }
});

export const fetchPowderBatchesSummary = createAsyncThunk<
  PowderBatchesSummary,
  void,
  { rejectValue: string }
>("cashDashboard/fetchPowderBatchesSummary", async (_, { rejectWithValue }) => {
  try {
    return await getPowderBatchesSummary();
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch powder batches summary"),
    );
  }
});

// --- Slice ---

const cashDashboardSlice = createSlice({
  name: "cashDashboard",
  initialState,
  reducers: {
    resetDashboardState: () => initialState,
    clearDashboardError: (state) => {
      state.error = null;
    },
    clearPowderBatchSelection: (state) => {
      state.selectedPowderBatch = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOpenSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.openSessions = action.payload;
      })
      .addCase(fetchOpenSessionsSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.openSessionsSummary = action.payload;
      })
      .addCase(fetchPowderBatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.powderBatches = action.payload;
      })
      .addCase(fetchPowderBatchesSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.powderBatchesSummary = action.payload;
      })

      // Global Matchers for clean Loading/Error handling
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.error = action.payload ?? "An unexpected error occurred";
        },
      );
  },
});

export const {
  resetDashboardState,
  clearDashboardError,
  clearPowderBatchSelection,
} = cashDashboardSlice.actions;
export default cashDashboardSlice.reducer;
