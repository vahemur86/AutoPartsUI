import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getCashRegisters,
  createCashRegister,
  updateCashRegister,
  deleteCashRegister,
  getCashRegisterBalance,
  topUpCashRegister,
  openCashRegisterSession,
  assignOperatorToCashRegister,
  checkPendingStatus,
  getPendingTransaction,
  confirmCashRegister,
} from "@/services/settings/cash/registers";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  CashRegister,
  CashRegisterBalance,
  TopUpRequest,
  PendingTransaction,
} from "@/types/cash";

interface CashRegistersState {
  cashRegisters: CashRegister[];
  activeBalance: CashRegisterBalance | null;
  currentSessionId: number | null;
  isPending: boolean;
  pendingDetails: PendingTransaction | null;
  isLoading: boolean;
  isBalanceLoading: boolean;
  isPendingLoading: boolean;
  error: string | null;
}

const initialState: CashRegistersState = {
  cashRegisters: [],
  activeBalance: null,
  currentSessionId: null,
  isPending: false,
  pendingDetails: null,
  isLoading: false,
  isBalanceLoading: false,
  isPendingLoading: false,
  error: null,
};

// --- Async Thunks ---

export const fetchCashRegisters = createAsyncThunk<
  CashRegister[],
  number | undefined,
  { rejectValue: string }
>("cashRegisters/fetchAll", async (shopId, { rejectWithValue }) => {
  try {
    return await getCashRegisters(shopId);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch registers"),
    );
  }
});

export const addCashRegister = createAsyncThunk<
  CashRegister,
  Omit<CashRegister, "id" | "isActive">,
  { rejectValue: string }
>("cashRegisters/add", async (data, { rejectWithValue }) => {
  try {
    return await createCashRegister(data);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create register"),
    );
  }
});

export const editCashRegister = createAsyncThunk<
  CashRegister,
  { id: number; data: Omit<CashRegister, "id" | "shopId"> },
  { rejectValue: string }
>("cashRegisters/edit", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await updateCashRegister(id, data);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update register"),
    );
  }
});

export const removeCashRegister = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("cashRegisters/remove", async (id, { rejectWithValue }) => {
  try {
    await deleteCashRegister(id);
    return id;
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete register"),
    );
  }
});

export const fetchBalance = createAsyncThunk<
  CashRegisterBalance,
  number,
  { rejectValue: string }
>("cashRegisters/fetchBalance", async (id, { rejectWithValue }) => {
  try {
    return await getCashRegisterBalance(id);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch balance"),
    );
  }
});

export const topUpRegister = createAsyncThunk<
  CashRegisterBalance,
  { id: number; data: TopUpRequest },
  { rejectValue: string }
>("cashRegisters/topUp", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await topUpCashRegister(id, data);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to top up"));
  }
});

export const openSession = createAsyncThunk<
  { sessionId: number },
  number,
  { rejectValue: string }
>("cashRegisters/openSession", async (id, { rejectWithValue }) => {
  try {
    return await openCashRegisterSession(id);
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to open session"));
  }
});

export const assignOperator = createAsyncThunk<
  void,
  { cashRegisterId: number; userId: number },
  { rejectValue: string }
>(
  "cashRegisters/assignOperator",
  async ({ cashRegisterId, userId }, { rejectWithValue }) => {
    try {
      await assignOperatorToCashRegister({ cashRegisterId, userId });
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to assign operator to register"),
      );
    }
  },
);

export const checkPending = createAsyncThunk<
  boolean,
  number,
  { rejectValue: string }
>("cashRegisters/checkPending", async (cashBoxId, { rejectWithValue }) => {
  try {
    return await checkPendingStatus(cashBoxId);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to check pending status"),
    );
  }
});

export const fetchPendingTransaction = createAsyncThunk<
  PendingTransaction,
  number,
  { rejectValue: string }
>(
  "cashRegisters/fetchPendingTransaction",
  async (cashBoxId, { rejectWithValue }) => {
    try {
      return await getPendingTransaction(cashBoxId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch pending details"),
      );
    }
  },
);

// New Confirm Transaction Thunk
export const confirmTransaction = createAsyncThunk<
  void,
  number,
  { rejectValue: string }
>("cashRegisters/confirm", async (cashBoxId, { rejectWithValue }) => {
  try {
    await confirmCashRegister(cashBoxId);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to confirm transaction"),
    );
  }
});

// --- Slice ---

const cashRegistersSlice = createSlice({
  name: "cashRegisters",
  initialState,
  reducers: {
    clearActiveBalance: (state) => {
      state.activeBalance = null;
    },
    clearPendingData: (state) => {
      state.isPending = false;
      state.pendingDetails = null;
    },
    resetRegistersState: () => initialState,
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* fetchBalance specific cases */
      .addCase(fetchBalance.pending, (state) => {
        state.isBalanceLoading = true;
        state.error = null;
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.isBalanceLoading = false;
        state.activeBalance = action.payload;
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.isBalanceLoading = false;
        state.error = action.payload ?? "Failed to fetch balance";
      })

      /* Pending Status Cases */
      .addCase(checkPending.pending, (state) => {
        state.isPendingLoading = true;
      })
      .addCase(checkPending.fulfilled, (state, action) => {
        state.isPendingLoading = false;
        state.isPending = action.payload;
      })
      .addCase(checkPending.rejected, (state, action) => {
        state.isPendingLoading = false;
        state.error = action.payload ?? "Failed to check pending status";
      })

      /* Pending Details Cases */
      .addCase(fetchPendingTransaction.pending, (state) => {
        state.isPendingLoading = true;
      })
      .addCase(fetchPendingTransaction.fulfilled, (state, action) => {
        state.isPendingLoading = false;
        state.pendingDetails = action.payload;
      })
      .addCase(fetchPendingTransaction.rejected, (state, action) => {
        state.isPendingLoading = false;
        state.error = action.payload ?? "Failed to fetch pending details";
      })

      /* Confirm Transaction Case */
      .addCase(confirmTransaction.fulfilled, (state) => {
        state.isLoading = false;
        state.isPending = false;
        state.pendingDetails = null;
      })

      /* Standard fulfilled cases */
      .addCase(fetchCashRegisters.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cashRegisters = action.payload;
      })
      .addCase(addCashRegister.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cashRegisters.push(action.payload);
      })
      .addCase(editCashRegister.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.cashRegisters.findIndex(
          (r) => r.id === action.payload.id,
        );
        if (index !== -1) state.cashRegisters[index] = action.payload;
      })
      .addCase(removeCashRegister.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cashRegisters = state.cashRegisters.filter(
          (r) => r.id !== action.payload,
        );
      })
      .addCase(topUpRegister.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeBalance = action.payload;
      })
      .addCase(openSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSessionId = action.payload.sessionId;
      })
      .addCase(assignOperator.fulfilled, (state) => {
        state.isLoading = false;
      })

      .addMatcher(
        (action) =>
          action.type.endsWith("/pending") &&
          !action.type.includes("fetchBalance") &&
          !action.type.includes("Pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.endsWith("/rejected") &&
          !action.type.includes("fetchBalance") &&
          !action.type.includes("Pending"),
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.error = action.payload ?? "An unexpected error occurred";
        },
      );
  },
});

export const {
  clearError,
  clearActiveBalance,
  clearPendingData,
  resetRegistersState,
} = cashRegistersSlice.actions;

export default cashRegistersSlice.reducer;
