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

interface MetalPricesState {
  prices: MetalPrice[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MetalPricesState = {
  prices: [],
  isLoading: false,
  error: null,
};

// Async thunk for fetching current metal prices
export const fetchMetalPrices = createAsyncThunk<
  MetalPrice[],
  number,
  { rejectValue: string }
>(
  "metalPrices/fetchMetalPrices",
  async (cashRegisterId, { rejectWithValue }) => {
    try {
      const data = await getMetalPrices(cashRegisterId);
      return data;
    } catch (error: unknown) {
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

export const { clearPricesError } = metalPricesSlice.actions;
export default metalPricesSlice.reducer;
