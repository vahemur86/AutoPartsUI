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
  previewSalesLot,
  getSalesLotsSellForm,
  sellRecalculation,
  getSalesLotsPreview,
  calculateSalesLot,
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
  SalesLotPreviewResponse,
  SalesLotsSellFormResponse,
  SellRecalculationResponse,
  GetLotPreviewResponse,
  SalesLotsCalculatorResponse,
  SalesLotsCalculatorRequest,
} from "@/types/warehouses/salesLots";

// Utils
import { getApiErrorMessage } from "@/utils";

interface SalesLotsState {
  lots: BaseLot[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  selectedLot: GetLotDetailsResponse | null;
  selectedFormDetails: SalesLotsSellFormResponse | null;
  previewData: SalesLotPreviewResponse | null;
  lastCreatedId: number | null;
  lastSaleResult: SellSalesLotResponse | null;
  lastRecalculationResult: number | null;
  dropdownPreviewData: GetLotPreviewResponse | null;
  calculatorResult: SalesLotsCalculatorResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SalesLotsState = {
  lots: [],
  totalItems: 0,
  currentPage: 1,
  pageSize: 50,
  selectedLot: null,
  selectedFormDetails: null,
  lastRecalculationResult: null,
  previewData: null,
  dropdownPreviewData: null,
  lastCreatedId: null,
  lastSaleResult: null,
  calculatorResult: null,
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

export const fetchSalesLotPreview = createAsyncThunk<
  SalesLotPreviewResponse,
  CreateSalesLotRequest,
  { rejectValue: string }
>("salesLots/fetchPreview", async (request, { rejectWithValue }) => {
  try {
    return await previewSalesLot(request);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to preview sales lot"),
    );
  }
});

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

export const fetchSalesLotsSellForm = createAsyncThunk<
  SalesLotsSellFormResponse,
  { id: number; cashRegisterId: number },
  { rejectValue: string }
>(
  "salesLots/fetchSellForm",
  async ({ id, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await getSalesLotsSellForm(id, cashRegisterId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch lot form details"),
      );
    }
  },
);

export const recalculateSalesLot = createAsyncThunk<
  number,
  SellRecalculationResponse,
  { rejectValue: string }
>("salesLots/recalculate", async (request, { rejectWithValue }) => {
  try {
    return await sellRecalculation(request);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to recalculate sales lot"),
    );
  }
});

export const fetchSalesLotsPreviewById = createAsyncThunk<
  GetLotPreviewResponse,
  { id: number; cashRegisterId: number },
  { rejectValue: string }
>(
  "salesLots/fetchPreviewById",
  async ({ id, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await getSalesLotsPreview(id, cashRegisterId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to get lot preview"),
      );
    }
  },
);

export const calculateSalesLotThunk = createAsyncThunk<
  SalesLotsCalculatorResponse,
  SalesLotsCalculatorRequest,
  { rejectValue: string }
>("salesLots/calculate", async (request, { rejectWithValue }) => {
  try {
    return await calculateSalesLot(request);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to calculate sales lot"),
    );
  }
});

const salesLotsSlice = createSlice({
  name: "salesLots",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCalculatorResult: (state) => {
      state.calculatorResult = null;
    },
    clearSelectedLot: (state) => {
      state.selectedLot = null;
    },
    clearPreviewData: (state) => {
      state.previewData = null;
      state.error = null;
      state.isLoading = false;
    },
    resetSalesLotsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesLots.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lots = action.payload.results;
        state.totalItems = action.payload.totalItems;
        state.currentPage = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchSalesLotDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedLot = action.payload;
      })
      .addCase(fetchSalesLotsSellForm.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSalesLotsSellForm.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch lot form details";
      })
      .addCase(fetchSalesLotsSellForm.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedFormDetails = action.payload;
      })
      .addCase(fetchSalesLotsPreviewById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSalesLotsPreviewById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dropdownPreviewData = action.payload;
      })
      .addCase(fetchSalesLotsPreviewById.rejected, (state, action) => {
        state.isLoading = false;
        state.dropdownPreviewData = null;
        state.error = action.payload ?? "Failed to load preview";
      })
      .addCase(fetchSalesLotPreview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSalesLotPreview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.previewData = action.payload;
        state.error = null;
      })
      .addCase(fetchSalesLotPreview.rejected, (state, action) => {
        state.isLoading = false;
        state.previewData = null;
        state.error = action.payload ?? "Failed to load preview";
      })
      .addCase(calculateSalesLotThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(calculateSalesLotThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.calculatorResult = action.payload;
      })
      .addCase(calculateSalesLotThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.calculatorResult = null;
        state.error = action.payload ?? "Failed to calculate sales lot";
      })
      .addCase(createNewSalesLot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastCreatedId = action.payload;
      })
      .addCase(recalculateSalesLot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastRecalculationResult = action.payload;
      })
      .addCase(processLotSale.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastSaleResult = action.payload;
        state.selectedLot = null;
      })
      .addMatcher(
        (action) =>
          action.type.endsWith("/pending") &&
          action.type.startsWith("salesLots/"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.endsWith("/rejected") &&
          action.type.startsWith("salesLots/"),
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.error = action.payload ?? "An unexpected error occurred";
        },
      );
  },
});

export const {
  clearError,
  clearSelectedLot,
  clearPreviewData,
  resetSalesLotsState,
  clearCalculatorResult,
} = salesLotsSlice.actions;

export default salesLotsSlice.reducer;
