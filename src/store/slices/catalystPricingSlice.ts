import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

import { getApiErrorMessage } from "@/utils";
import type { CatalystPricing } from "@/types/settings";
import {
  getCatalystPricing,
  updateCatalystPricing,
} from "@/services/settings/catalystPricing";

interface CatakystPricingState {
  prices: CatalystPricing | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CatakystPricingState = {
  prices: null,
  isLoading: false,
  error: null,
};

export const fetchCatalystPricing = createAsyncThunk<
  CatalystPricing,
  number,
  { rejectValue: string }
>(
  "catalystPricing/fetchCatalystPricing",
  async (cashRegisterId, { rejectWithValue }) => {
    try {
      const data = await getCatalystPricing(cashRegisterId);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch current catalyst pricing"),
      );
    }
  },
);

export const editCatalystPricing = createAsyncThunk<
  CatalystPricing,
  CatalystPricing,
  { rejectValue: string }
>(
  "catalystPricings/editCatalystPricing",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await updateCatalystPricing(payload);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update catalyst pricing"),
      );
    }
  },
);

const catalystPricingSlice = createSlice({
  name: "catalystPricing",
  initialState,
  reducers: {
    clearPricesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalystPricing.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCatalystPricing.fulfilled,
        (state, action: PayloadAction<CatalystPricing>) => {
          state.isLoading = false;
          state.prices = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchCatalystPricing.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch catalyst prices";
      });

    //edit
    builder
      .addCase(editCatalystPricing.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        editCatalystPricing.fulfilled,
        (state, action: PayloadAction<CatalystPricing>) => {
          state.isLoading = false;
          state.prices = action.payload;
          state.error = null;
        },
      )
      .addCase(editCatalystPricing.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update catalyst pricing";
      });
  },
});

export const { clearPricesError } = catalystPricingSlice.actions;
export default catalystPricingSlice.reducer;
