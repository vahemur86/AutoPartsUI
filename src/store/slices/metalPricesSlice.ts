import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import { getMetalPrices } from "@/services/settings/metalPrices";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { MetalPrice } from "@/types/settings";
import type { KitcoQuotaSnapshot } from "@/types/kitco";
import { KitcoApiError } from "@/types/kitco";

interface MetalPricesState {
  prices: MetalPrice[];
  isLoading: boolean;
  error: string | null;
  kitcoQuota: KitcoQuotaSnapshot | null;
}

const initialState: MetalPricesState = {
  prices: [],
  isLoading: false,
  error: null,
  kitcoQuota: null,
};

// Async thunk for fetching current metal prices
export const fetchMetalPrices = createAsyncThunk<
  MetalPrice[],
  number,
  { rejectValue: string }
>(
  "metalPrices/fetchMetalPrices",
  async (cashRegisterId, { rejectWithValue, dispatch }) => {
    try {
      const data = await getMetalPrices(cashRegisterId, (quota) => {
        dispatch(setKitcoQuota(quota));
      });
      return data;
    } catch (error: unknown) {
      if (error instanceof KitcoApiError) {
        if (error.quota) dispatch(setKitcoQuota(error.quota));
        if (error.statusCode === 402) return rejectWithValue("KITCO_PAYMENT_REQUIRED");
      }
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch current metal prices"),
      );
    }
  },
);

const metalPricesSlice = createSlice({
  name: "metalPrices",
  initialState,
  reducers: {
    clearPricesError: (state) => {
      state.error = null;
    },
    setKitcoQuota: (state, action: PayloadAction<KitcoQuotaSnapshot>) => {
      state.kitcoQuota = { ...state.kitcoQuota, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetalPrices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchMetalPrices.fulfilled,
        (state, action: PayloadAction<MetalPrice[]>) => {
          state.isLoading = false;
          state.prices = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchMetalPrices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch metal prices";
      });
  },
});

export const { clearPricesError, setKitcoQuota } = metalPricesSlice.actions;
export default metalPricesSlice.reducer;
