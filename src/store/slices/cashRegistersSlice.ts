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
  getCashRegisterBalance,
  openCashRegisterSession,
  closeCashRegisterSession,
} from "@/services/settings/cashRegisters";

// types
import type { CashRegister, CashRegisterBalance } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface CashRegistersState {
  cashRegisters: CashRegister[];
  cashRegisterBalance: CashRegisterBalance | null;
  sessionId: number | null;
  isLoading: boolean;
  error: string | null;
}

// Initialize from localStorage
const savedSessionId = localStorage.getItem("cash_session_id");

const initialState: CashRegistersState = {
  cashRegisters: [],
  cashRegisterBalance: null,
  sessionId: savedSessionId ? Number(savedSessionId) : null,
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

export const fetchCashRegisterBalance = createAsyncThunk<
  CashRegisterBalance,
  number,
  { rejectValue: string }
>(
  "cashRegisters/fetchCashRegisterBalance",
  async (cashRegisterId, { rejectWithValue }) => {
    try {
      const data = await getCashRegisterBalance(cashRegisterId);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch cash register balance."),
      );
    }
  },
);

export const openSession = createAsyncThunk<
  { sessionId: number },
  number,
  { rejectValue: string }
>("cashRegisters/openSession", async (cashRegisterId, { rejectWithValue }) => {
  try {
    const data = await openCashRegisterSession(cashRegisterId);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to open cash register session."),
    );
  }
});

export const closeSession = createAsyncThunk<
  void,
  { sessionId: number; cashRegisterId: number },
  { rejectValue: string }
>(
  "cashRegisters/closeSession",
  async ({ sessionId, cashRegisterId }, { rejectWithValue }) => {
    try {
      await closeCashRegisterSession({ sessionId, cashRegisterId });
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to close cash register session."),
      );
    }
  },
);

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

    builder
      .addCase(fetchCashRegisterBalance.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCashRegisterBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cashRegisterBalance = action.payload;
      })
      .addCase(fetchCashRegisterBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch balance.";
      });

    // Open Session
    builder
      .addCase(openSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(openSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionId = action.payload.sessionId;
        localStorage.setItem(
          "cash_session_id",
          action.payload.sessionId.toString(),
        );
      })
      .addCase(openSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to open session.";
      });

    // Close Session
    builder
      .addCase(closeSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(closeSession.fulfilled, (state) => {
        state.isLoading = false;
        state.sessionId = null;
        localStorage.removeItem("cash_session_id");
      })
      .addCase(closeSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to close session.";
      });
  },
});

export const { clearError } = cashRegistersSlice.actions;
export default cashRegistersSlice.reducer;
