import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getSalePercentages,
  createSalePercentage,
  updateSalePercentage,
  deleteSalePercentage,
} from "@/services/settings/salePercentages";

// types
import type { SalePercentage } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface SalePercentagesState {
  salePercentages: SalePercentage[];
  isLoading: boolean;
  error: string | null;
}

const initialState: SalePercentagesState = {
  salePercentages: [],
  isLoading: false,
  error: null,
};

type CreateSalePercentagePayload = {
  percentage: number;
  isActive: boolean;
};

type UpdateSalePercentagePayload = CreateSalePercentagePayload & { id: number };

// Async thunk for fetching sale percentages
export const fetchSalePercentages = createAsyncThunk<
  SalePercentage[],
  void,
  { rejectValue: string }
>("salePercentages/fetchSalePercentages", async (_, { rejectWithValue }) => {
  try {
    const data = await getSalePercentages();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch sale percentages"),
    );
  }
});

// Async thunk for creating sale percentage
export const addSalePercentage = createAsyncThunk<
  SalePercentage,
  CreateSalePercentagePayload,
  { rejectValue: string }
>(
  "salePercentages/addSalePercentage",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await createSalePercentage(
        payload.percentage,
        payload.isActive,
      );
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create sale percentage"),
      );
    }
  },
);

// Async thunk for updating sale percentage
export const updateSalePercentageInStore = createAsyncThunk<
  SalePercentage,
  UpdateSalePercentagePayload,
  { rejectValue: string }
>(
  "salePercentages/updateSalePercentage",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await updateSalePercentage(
        payload.id,
        payload.percentage,
        payload.isActive,
      );
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update sale percentage"),
      );
    }
  },
);

// Async thunk for deleting sale percentage
export const removeSalePercentage = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  "salePercentages/removeSalePercentage",
  async (id, { rejectWithValue }) => {
    try {
      await deleteSalePercentage(id);
      return id;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to delete sale percentage"),
      );
    }
  },
);

const salePercentagesSlice = createSlice({
  name: "salePercentages",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearActiveFlags: (
      state,
      action: PayloadAction<{ excludeId?: number } | undefined>,
    ) => {
      state.salePercentages = state.salePercentages.map((sp) => ({
        ...sp,
        isActive: sp.id === action.payload?.excludeId,
      }));
    },
  },
  extraReducers: (builder) => {
    // Fetch sale percentages
    builder
      .addCase(fetchSalePercentages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchSalePercentages.fulfilled,
        (state, action: PayloadAction<SalePercentage[]>) => {
          state.isLoading = false;
          state.salePercentages = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchSalePercentages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch sale percentages";
      });

    // Add sale percentage
    builder
      .addCase(addSalePercentage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addSalePercentage.fulfilled,
        (state, action: PayloadAction<SalePercentage>) => {
          state.isLoading = false;
          state.salePercentages.push(action.payload);
          state.error = null;
        },
      )
      .addCase(addSalePercentage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create sale percentage";
      });

    // Update sale percentage
    builder
      .addCase(updateSalePercentageInStore.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateSalePercentageInStore.fulfilled,
        (state, action: PayloadAction<SalePercentage>) => {
          state.isLoading = false;
          const index = state.salePercentages.findIndex(
            (sp) => sp.id === action.payload.id,
          );
          if (index !== -1) {
            state.salePercentages[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(updateSalePercentageInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update sale percentage";
      });

    // Delete sale percentage
    builder
      .addCase(removeSalePercentage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeSalePercentage.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.salePercentages = state.salePercentages.filter(
            (sp) => sp.id !== action.payload,
          );
          state.error = null;
        },
      )
      .addCase(removeSalePercentage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete sale percentage";
      });
  },
});

export const { clearError, clearActiveFlags } = salePercentagesSlice.actions;
export default salePercentagesSlice.reducer;

