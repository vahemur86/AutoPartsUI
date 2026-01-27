import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// Individual service import
import { getRegisterSession } from "@/services/settings/cash/sessions";

// types
import type { GetRegisterSession } from "@/types/cash";

// utils
import { getApiErrorMessage } from "@/utils";

interface RegisterSessionState {
  sessionDetails: GetRegisterSession | null;
  hasOpenSession: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: RegisterSessionState = {
  sessionDetails: null,
  hasOpenSession: false,
  isLoading: false,
  error: null,
};

// --- Async Thunks ---

export const fetchRegisterSession = createAsyncThunk<
  GetRegisterSession,
  number,
  { rejectValue: string }
>(
  "registerSession/fetchStatus",
  async (cashRegisterId, { rejectWithValue }) => {
    try {
      return await getRegisterSession(cashRegisterId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to verify session status"),
      );
    }
  },
);

// --- Slice ---

const registerSessionSlice = createSlice({
  name: "registerSession",
  initialState,
  reducers: {
    // Clears the error state (used by Global Error Watcher)
    clearError: (state) => {
      state.error = null;
    },
    clearSessionStatus: (state) => {
      state.sessionDetails = null;
      state.hasOpenSession = false;
    },
    resetSessionState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchRegisterSession.fulfilled,
        (state, action: PayloadAction<GetRegisterSession>) => {
          state.isLoading = false;
          state.sessionDetails = action.payload;
          state.hasOpenSession = action.payload.hasOpenSession;
        },
      )

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

export const { clearError, clearSessionStatus, resetSessionState } =
  registerSessionSlice.actions;
export default registerSessionSlice.reducer;
