import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getProfitReport,
  getInventoryLotsReport,
} from "@/services/warehouses/reports";

// types
import type {
  GetProfitReportParams,
  ProfitReportResponse,
  GetInventoryLotsReportParams,
  InventoryLotsReportResponse,
} from "@/types/warehouses/reports";

// utils
import { getApiErrorMessage } from "@/utils";

interface AdminReportsState {
  profitData: ProfitReportResponse | null;
  inventoryLots: InventoryLotsReportResponse;
  isLoading: boolean;
  error: string | null;
}

const initialState: AdminReportsState = {
  profitData: null,
  inventoryLots: [],
  isLoading: false,
  error: null,
};

export const fetchProfitReport = createAsyncThunk<
  ProfitReportResponse,
  GetProfitReportParams,
  { rejectValue: string }
>("adminReports/fetchProfit", async (params, { rejectWithValue }) => {
  try {
    return await getProfitReport(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to load profit report"),
    );
  }
});

export const fetchInventoryLotsReport = createAsyncThunk<
  InventoryLotsReportResponse,
  GetInventoryLotsReportParams,
  { rejectValue: string }
>("adminReports/fetchInventoryLots", async (params, { rejectWithValue }) => {
  try {
    return await getInventoryLotsReport(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to load inventory report"),
    );
  }
});

const adminReportsSlice = createSlice({
  name: "adminReports",
  initialState,
  reducers: {
    clearReportsError: (state) => {
      state.error = null;
    },
    resetReportsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchProfitReport.fulfilled,
        (state, action: PayloadAction<ProfitReportResponse>) => {
          state.isLoading = false;
          state.profitData = action.payload;
        },
      )
      .addCase(
        fetchInventoryLotsReport.fulfilled,
        (state, action: PayloadAction<InventoryLotsReportResponse>) => {
          state.isLoading = false;
          state.inventoryLots = action.payload;
        },
      )

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

export const { clearReportsError, resetReportsState } =
  adminReportsSlice.actions;
export default adminReportsSlice.reducer;
