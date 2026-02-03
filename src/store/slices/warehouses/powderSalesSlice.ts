import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import { getPowderSales } from "@/services/warehouses/salesLots";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  GetPowderSalesParams,
  GetPowderSalesResponse,
} from "@/types/warehouses/salesLots";

interface PowderSalesState {
  data: GetPowderSalesResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PowderSalesState = {
  data: null,
  isLoading: false,
  error: null,
};

export const fetchPowderSales = createAsyncThunk<
  GetPowderSalesResponse,
  GetPowderSalesParams,
  { rejectValue: string }
>("powderSales/fetchPowderSales", async (params, { rejectWithValue }) => {
  try {
    return await getPowderSales(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to load powder sales"),
    );
  }
});

const powderSalesSlice = createSlice({
  name: "powderSales",
  initialState,
  reducers: {
    clearPowderSalesError: (state) => {
      state.error = null;
    },
    resetPowderSalesState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchPowderSales.fulfilled,
        (state, action: PayloadAction<GetPowderSalesResponse>) => {
          state.isLoading = false;
          state.data = action.payload;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("powderSales/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("powderSales/") &&
          action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.error = action.payload ?? "An unexpected error occurred";
        },
      );
  },
});

export const { clearPowderSalesError, resetPowderSalesState } =
  powderSalesSlice.actions;
export default powderSalesSlice.reducer;
