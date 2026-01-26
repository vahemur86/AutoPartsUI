import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  createMetalRate,
  deleteMetalRate,
  getMetalRates,
  updateMetalRate,
} from "@/services/settings/metalRates";

// types
import type { MetalRate } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface MetalRatesState {
  metalRates: MetalRate[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MetalRatesState = {
  metalRates: [],
  isLoading: false,
  error: null,
};

// Async thunk for fetching metal rates
export const fetchMetalRates = createAsyncThunk<
  MetalRate[],
  number | undefined,
  { rejectValue: string }
>("metalRates/fetchMetalRates", async (cashRegisterId, { rejectWithValue }) => {
  try {
    const data = await getMetalRates(cashRegisterId);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch tasks"));
  }
});

// Async thunk for creating metal rate
export const addMetalRate = createAsyncThunk<
  MetalRate,
  Omit<MetalRate, "id">,
  { rejectValue: string }
>("metalRates/addMetalRate", async (payload, { rejectWithValue }) => {
  try {
    const data = await createMetalRate(payload);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create metal rate"),
    );
  }
});

// Async thunk for updating metal rate
export const editMetalRate = createAsyncThunk<
  MetalRate,
  Omit<MetalRate, "id"> & { id: number },
  { rejectValue: string }
>("metalRates/editMetalRate", async ({ id, ...rest }, { rejectWithValue }) => {
  try {
    const data = await updateMetalRate(id, rest);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update metal rate"),
    );
  }
});

// Async thunk for deleting metal rate
export const removeMetalRate = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("metalRates/removeMetalRate", async (id, { rejectWithValue }) => {
  try {
    await deleteMetalRate(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete metal rate"),
    );
  }
});

const metalRatesSlice = createSlice({
  name: "metalRates",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch metal rates
    builder
      .addCase(fetchMetalRates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchMetalRates.fulfilled,
        (state, action: PayloadAction<MetalRate[]>) => {
          state.isLoading = false;
          state.metalRates = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchMetalRates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch metal rates";
      });

    // Add metal rate
    builder
      .addCase(addMetalRate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addMetalRate.fulfilled,
        (state, action: PayloadAction<MetalRate>) => {
          state.isLoading = false;
          state.metalRates.push(action.payload);
          state.error = null;
        },
      )
      .addCase(addMetalRate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create metal rate";
      });

    // Update metal rate
    builder
      .addCase(editMetalRate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        editMetalRate.fulfilled,
        (state, action: PayloadAction<MetalRate>) => {
          state.isLoading = false;
          const index = state.metalRates.findIndex(
            (s) => s.id === action.payload.id,
          );
          if (index !== -1) {
            state.metalRates[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(editMetalRate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update metal rate";
      });

    // Delete metal rate
    builder
      .addCase(removeMetalRate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeMetalRate.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.metalRates = state.metalRates.filter(
            (t) => t.id !== action.payload,
          );
          state.error = null;
        },
      )
      .addCase(removeMetalRate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete metal rate";
      });
  },
});

export const { clearError } = metalRatesSlice.actions;
export default metalRatesSlice.reducer;
