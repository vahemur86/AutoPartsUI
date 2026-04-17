import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getPowderSales,
  getPowderSalesAdjustments,
  reconcilePowderSale as reconcileService, // Import the service
} from "@/services/warehouses/salesLots";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  GetPowderSalesAdjustmentsResponse,
  GetPowderSalesParams,
  GetPowderSalesResponse,
  ReconcilePowderSaleRequest, // Import the request type
} from "@/types/warehouses/salesLots";

interface PowderSalesState {
  data: GetPowderSalesResponse | null;
  adjustmentData: GetPowderSalesAdjustmentsResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PowderSalesState = {
  data: null,
  adjustmentData: null,
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

export const fetchPowderSalesAdjustments = createAsyncThunk<
  GetPowderSalesAdjustmentsResponse,
  GetPowderSalesParams,
  { rejectValue: string }
>(
  "powderSales/fetchPowderSalesAdjustments",
  async (params, { rejectWithValue }) => {
    try {
      return await getPowderSalesAdjustments(params);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to load powder sales adjustments"),
      );
    }
  },
);

export const reconcilePowderSale = createAsyncThunk<
  void,
  ReconcilePowderSaleRequest,
  { rejectValue: string }
>("powderSales/reconcilePowderSale", async (params, { rejectWithValue }) => {
  try {
    await reconcileService(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to reconcile powder sale"),
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
      .addCase(
        fetchPowderSalesAdjustments.fulfilled,
        (state, action: PayloadAction<GetPowderSalesAdjustmentsResponse>) => {
          state.isLoading = false;
          state.adjustmentData = action.payload;
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