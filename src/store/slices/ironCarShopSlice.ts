import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getCarModels,
  getIronTypesByModel,
  getIronTypesPrices,
  bulkPurchaseIron,
} from "@/services/ironCarShop";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  CarModel,
  IronType,
  IronTypePrice,
  IronPricesResponse,
  PurchaseIronResponse,
  BulkPurchasePayload,
} from "@/types/ironCarShop";

interface IronCarShopState {
  carModels: CarModel[];
  ironTypes: IronType[];
  ironPrices: IronTypePrice[];
  // Store the overall totals from the calculation response
  ironTotals: {
    weightKgTotal: number;
    totalAmountTotal: number;
  } | null;
  lastPurchase: PurchaseIronResponse[] | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: IronCarShopState = {
  carModels: [],
  ironTypes: [],
  ironPrices: [],
  ironTotals: null,
  lastPurchase: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
};

export const fetchCarModels = createAsyncThunk<
  CarModel[],
  { cashRegisterId: number; lang: string },
  { rejectValue: string }
>(
  "ironCarShop/fetchCarModels",
  async ({ cashRegisterId, lang }, { rejectWithValue }) => {
    try {
      return await getCarModels(cashRegisterId, lang);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Error loading car models"),
      );
    }
  },
);

export const fetchIronTypes = createAsyncThunk<
  IronType[],
  { carModelId: number; cashRegisterId: number; lang: string },
  { rejectValue: string }
>(
  "ironCarShop/fetchIronTypes",
  async ({ carModelId, cashRegisterId, lang }, { rejectWithValue }) => {
    try {
      return await getIronTypesByModel(carModelId, cashRegisterId, lang);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Error loading iron types"),
      );
    }
  },
);

export const calculateIronPrices = createAsyncThunk<
  IronPricesResponse,
  { params: Parameters<typeof getIronTypesPrices>[0]; cashRegisterId: number },
  { rejectValue: string }
>(
  "ironCarShop/calculatePrices",
  async ({ params, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await getIronTypesPrices(params, cashRegisterId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Price calculation failed"),
      );
    }
  },
);

export const submitBulkPurchase = createAsyncThunk<
  PurchaseIronResponse[],
  { payload: BulkPurchasePayload; cashRegisterId: number; lang: string },
  { rejectValue: string }
>(
  "ironCarShop/submitBulkPurchase",
  async ({ payload, cashRegisterId, lang }, { rejectWithValue }) => {
    try {
      return await bulkPurchaseIron(payload, cashRegisterId, lang);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Bulk purchase failed"));
    }
  },
);

const ironCarShopSlice = createSlice({
  name: "ironCarShop",
  initialState,
  reducers: {
    clearShopError: (state) => {
      state.error = null;
    },
    resetShopState: () => initialState,
    clearPrices: (state) => {
      state.ironPrices = [];
      state.ironTotals = null;
      state.ironTypes = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCarModels.fulfilled, (state, action) => {
        state.isLoading = false;
        state.carModels = action.payload;
      })
      .addCase(fetchIronTypes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ironTypes = action.payload;
      })
      .addCase(calculateIronPrices.fulfilled, (state, action) => {
        state.isLoading = false;
        // Map the items array to ironPrices
        state.ironPrices = action.payload.items;
        // Map the totals to the new state property
        state.ironTotals = {
          weightKgTotal: action.payload.weightKgTotal,
          totalAmountTotal: action.payload.totalAmountTotal,
        };
      })
      .addCase(submitBulkPurchase.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.lastPurchase = action.payload;
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("ironCarShop/") &&
          action.type.endsWith("/pending"),
        (state, action) => {
          if (action.type.includes("submit")) {
            state.isSubmitting = true;
          } else {
            state.isLoading = true;
          }
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("ironCarShop/") &&
          action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isSubmitting = false;
          state.error = action.payload ?? "An error occurred";
        },
      );
  },
});

export const { clearShopError, resetShopState, clearPrices } =
  ironCarShopSlice.actions;
export default ironCarShopSlice.reducer;
