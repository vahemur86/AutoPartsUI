import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// Services
import {
  getSalesLots,
  getSalesLot,
  createSalesLot,
  sellSalesLot,
} from "@/services/warehouses/salesLots";

// Types
import type {
  GetSalesLotsParams,
  GetSalesLotsResponse,
  GetLotDetailsResponse,
  CreateSalesLotRequest,
  SellSalesLotRequest,
  SellSalesLotResponse,
  BaseLot,
} from "@/types/warehouses/salesLots";

// Utils
import { getApiErrorMessage } from "@/utils";

interface SalesLotsState {
  lots: BaseLot[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  selectedLot: GetLotDetailsResponse | null;
  lastCreatedId: number | null;
  lastSaleResult: SellSalesLotResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SalesLotsState = {
  lots: [],
  totalItems: 0,
  currentPage: 1,
  pageSize: 50,
  selectedLot: null,
  lastCreatedId: null,
  lastSaleResult: null,
  isLoading: false,
  error: null,
};

// --- Async Thunks ---

export const fetchSalesLots = createAsyncThunk<
  GetSalesLotsResponse,
  GetSalesLotsParams,
  { rejectValue: string }
>("salesLots/fetchAll", async (params, { rejectWithValue }) => {
  try {
    return await getSalesLots(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch sales lots"),
    );
  }
});

export const fetchSalesLotDetails = createAsyncThunk<
  GetLotDetailsResponse,
  { id: number; cashRegisterId: number },
  { rejectValue: string }
>(
  "salesLots/fetchDetails",
  async ({ id, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await getSalesLot(id, cashRegisterId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch lot details"),
      );
    }
  },
);

export const createNewSalesLot = createAsyncThunk<
  number,
  CreateSalesLotRequest,
  { rejectValue: string }
>("salesLots/create", async (request, { rejectWithValue }) => {
  try {
    return await createSalesLot(request);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create sales lot"),
    );
  }
});

export const processLotSale = createAsyncThunk<
  SellSalesLotResponse,
  SellSalesLotRequest,
  { rejectValue: string }
>("salesLots/sell", async (request, { rejectWithValue }) => {
  try {
    return await sellSalesLot(request);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to process sale"));
  }
});

const salesLotsSlice = createSlice({
  name: "salesLots",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedLot: (state) => {
      state.selectedLot = null;
    },
    resetSalesLotsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchSalesLots.fulfilled,
        (state, action: PayloadAction<GetSalesLotsResponse>) => {
          state.isLoading = false;
          state.lots = action.payload.results;
          state.totalItems = action.payload.totalItems;
          state.currentPage = action.payload.page;
          state.pageSize = action.payload.pageSize;
        },
      )
      .addCase(
        fetchSalesLotDetails.fulfilled,
        (state, action: PayloadAction<GetLotDetailsResponse>) => {
          state.isLoading = false;
          state.selectedLot = action.payload;
        },
      )
      .addCase(
        createNewSalesLot.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.lastCreatedId = action.payload;
        },
      )
      .addCase(
        processLotSale.fulfilled,
        (state, action: PayloadAction<SellSalesLotResponse>) => {
          state.isLoading = false;
          state.lastSaleResult = action.payload;
          state.selectedLot = null;
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

export const { clearError, clearSelectedLot, resetSalesLotsState } =
  salesLotsSlice.actions;
export default salesLotsSlice.reducer;
