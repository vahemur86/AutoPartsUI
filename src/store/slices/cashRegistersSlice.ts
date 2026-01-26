import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  createCashRegister,
  getCashRegisters,
  updateCashRegister,
  deleteCashRegister,
} from "@/services/settings/cashRegisters";

// types
import type { CashRegister } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface CashRegistersState {
  cashRegisters: CashRegister[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CashRegistersState = {
  cashRegisters: [],
  isLoading: false,
  error: null,
};

// Async thunk for fetching cash registers
export const fetchCashRegisters = createAsyncThunk<
  CashRegister[],
  number | undefined,
  { rejectValue: string }
>("cashRegisters/fetchCashRegisters", async (shopId, { rejectWithValue }) => {
  try {
    const data = await getCashRegisters(shopId);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch cash registers"),
    );
  }
});

// Async thunk for creating cash register
export const addCashRegister = createAsyncThunk<
  CashRegister,
  Omit<CashRegister, "id" | "isActive">,
  { rejectValue: string }
>("cashRegisters/addCashRegister", async (payload, { rejectWithValue }) => {
  try {
    const data = await createCashRegister(payload);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create cash register"),
    );
  }
});

// Async thunk for updating cash register
export const editCashRegister = createAsyncThunk<
  CashRegister,
  Omit<CashRegister, "id" | "shopId"> & { id: number },
  { rejectValue: string }
>(
  "cashRegisters/editCashRegister",
  async ({ id, ...rest }, { rejectWithValue }) => {
    try {
      const data = await updateCashRegister(id, rest);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update cash register"),
      );
    }
  },
);

// Async thunk for deleting cash register
export const removeCashRegister = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("cashRegisters/removeCashRegister", async (id, { rejectWithValue }) => {
  try {
    await deleteCashRegister(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete cash register"),
    );
  }
});

const cashRegistersSlice = createSlice({
  name: "cashRegisters",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch cash registers
    builder
      .addCase(fetchCashRegisters.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCashRegisters.fulfilled,
        (state, action: PayloadAction<CashRegister[]>) => {
          state.isLoading = false;
          state.cashRegisters = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchCashRegisters.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch cash registers";
      });

    // Add cash register
    builder
      .addCase(addCashRegister.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addCashRegister.fulfilled,
        (state, action: PayloadAction<CashRegister>) => {
          state.isLoading = false;
          state.cashRegisters.push(action.payload);
          state.error = null;
        },
      )
      .addCase(addCashRegister.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create cash register";
      });

    // Update cash register
    builder
      .addCase(editCashRegister.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        editCashRegister.fulfilled,
        (state, action: PayloadAction<CashRegister>) => {
          state.isLoading = false;
          const index = state.cashRegisters.findIndex(
            (s) => s.id === action.payload.id,
          );
          if (index !== -1) {
            state.cashRegisters[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(editCashRegister.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update cash register";
      });

    // Delete cash register
    builder
      .addCase(removeCashRegister.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeCashRegister.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.cashRegisters = state.cashRegisters.filter(
            (t) => t.id !== action.payload,
          );
          state.error = null;
        },
      )
      .addCase(removeCashRegister.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete cash register";
      });
  },
});

export const { clearError } = cashRegistersSlice.actions;
export default cashRegistersSlice.reducer;
