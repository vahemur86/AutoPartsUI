import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  createExchangeRate,
  getExchangeRates,
  updateExchangeRate,
  updateExchangeRateActivityStatus,
} from "@/services/settings/exchangeRates";

// types
import type { ExchangeRate, CreateExchangeRate } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface ExchangeRatesState {
  exchangeRates: ExchangeRate[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ExchangeRatesState = {
  exchangeRates: [],
  isLoading: false,
  error: null,
};

// Async thunk for fetching exchange rates
export const fetchExchangeRates = createAsyncThunk<
  ExchangeRate[],
  void,
  { rejectValue: string }
>("exchangeRates/fetchExchangeRates", async (_, { rejectWithValue }) => {
  try {
    const data = await getExchangeRates();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch exchange rates"),
    );
  }
});

// Async thunk for creating exchange rate
export const addExchangeRate = createAsyncThunk<
  ExchangeRate,
  CreateExchangeRate,
  { rejectValue: string }
>("exchangeRates/addExchangeRate", async (payload, { rejectWithValue }) => {
  try {
    const data = await createExchangeRate(payload);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create exchange rate"),
    );
  }
});

// Async thunk for updating exchange rate
export const editExchangeRate = createAsyncThunk<
  ExchangeRate,
  { id: number; payload: Omit<ExchangeRate, "id"> },
  { rejectValue: string }
>("exchangeRates/editExchangeRate", async (payload, { rejectWithValue }) => {
  try {
    const data = await updateExchangeRate(payload);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update exchange rate"),
    );
  }
});

// Async thunk for updating exchange rate activity status
export const editExchangeRateActivityStatus = createAsyncThunk<
  ExchangeRate,
  { id: number; action: "activate" | "deactivate" },
  { rejectValue: string }
>(
  "exchangeRates/editExchangeRateActivityStatus",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await updateExchangeRateActivityStatus(payload);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, `Failed to ${payload.action} exchange rate`),
      );
    }
  },
);

const exchangeRatesSlices = createSlice({
  name: "exchangeRates",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch exchange rates
    builder
      .addCase(fetchExchangeRates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchExchangeRates.fulfilled,
        (state, action: PayloadAction<ExchangeRate[]>) => {
          state.isLoading = false;
          state.exchangeRates = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchExchangeRates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch exchange rates";
      });

    // Add exchange rate
    builder
      .addCase(addExchangeRate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addExchangeRate.fulfilled,
        (state, action: PayloadAction<ExchangeRate>) => {
          state.isLoading = false;
          state.exchangeRates.push(action.payload);
          state.error = null;
        },
      )
      .addCase(addExchangeRate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create exchange rate";
      });

    // Update exchange rate
    builder
      .addCase(editExchangeRate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        editExchangeRate.fulfilled,
        (state, action: PayloadAction<ExchangeRate>) => {
          state.isLoading = false;
          const index = state.exchangeRates.findIndex(
            (s) => s.id === action.payload.id,
          );
          if (index !== -1) {
            state.exchangeRates[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(editExchangeRate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update exchange rate";
      });

    // Update exchange rate activity status
    builder
      .addCase(editExchangeRateActivityStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        editExchangeRateActivityStatus.fulfilled,
        (state, action: PayloadAction<ExchangeRate>) => {
          state.isLoading = false;
          const index = state.exchangeRates.findIndex(
            (s) => s.id === action.payload.id,
          );
          if (index !== -1) {
            state.exchangeRates[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(editExchangeRateActivityStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update exchange rate";
      });
  },
});

export const { clearError } = exchangeRatesSlices.actions;
export default exchangeRatesSlices.reducer;
