import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getOpenSessions,
  getOpenSessionsSummary,
} from "@/services/settings/cash/dashboard";

// types
import type { OpenSession, OpenSessionSummary } from "@/types/cash";

// utils
import { getApiErrorMessage } from "@/utils";

interface CashDashboardState {
  openSessions: OpenSession[];
  openSessionsSummary: OpenSessionSummary[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CashDashboardState = {
  openSessions: [],
  openSessionsSummary: [],
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
  Parameters<typeof getOpenSessionsSummary>[0],
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

// --- Slice ---

const cashDashboardSlice = createSlice({
  name: "cashDashboard",
  initialState,
  reducers: {
    resetDashboardState: () => initialState,
    clearDashboardError: (state) => {
      state.error = null;
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

export const { resetDashboardState, clearDashboardError } =
  cashDashboardSlice.actions;
export default cashDashboardSlice.reducer;
