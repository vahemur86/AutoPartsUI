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
  getCashRegisterSession,
} from "@/services/settings/cashRegisters";

// types
import type {
  CashRegister,
  CashRegisterBalance,
  GetCashRegisterSession,
} from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface CashRegistersState {
  cashRegisters: CashRegister[];
  cashRegisterBalance: CashRegisterBalance | null;
  sessionId: number | null;
  hasOpenSession: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: CashRegistersState = {
  cashRegisters: [],
  cashRegisterBalance: null,
  sessionId: null,
  hasOpenSession: false,
  isLoading: false,
  error: null,
};

export const fetchCashRegisters = createAsyncThunk<
  CashRegister[],
  number | undefined,
  { rejectValue: string }
>("cashRegisters/fetchCashRegisters", async (shopId, { rejectWithValue }) => {
  try {
    return await getCashRegisters(shopId);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch cash registers"),
    );
  }
});

export const addCashRegister = createAsyncThunk<
  CashRegister,
  Omit<CashRegister, "id" | "isActive">,
  { rejectValue: string }
>("cashRegisters/addCashRegister", async (payload, { rejectWithValue }) => {
  try {
    return await createCashRegister(payload);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create cash register"),
    );
  }
});

export const editCashRegister = createAsyncThunk<
  CashRegister,
  Omit<CashRegister, "id" | "shopId"> & { id: number },
  { rejectValue: string }
>(
  "cashRegisters/editCashRegister",
  async ({ id, ...rest }, { rejectWithValue }) => {
    try {
      return await updateCashRegister(id, rest);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update cash register"),
      );
    }
  },
);

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
      return await getCashRegisterBalance(cashRegisterId);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch balance."),
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
    return await openCashRegisterSession(cashRegisterId);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to open session."),
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
        getApiErrorMessage(error, "Failed to close session."),
      );
    }
  },
);

export const getSession = createAsyncThunk<
  GetCashRegisterSession,
  number,
  { rejectValue: string }
>("cashRegisters/getSession", async (cashRegisterId, { rejectWithValue }) => {
  try {
    return await getCashRegisterSession(cashRegisterId);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to get session status."),
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
      })
      .addCase(
        addCashRegister.fulfilled,
        (state, action: PayloadAction<CashRegister>) => {
          state.cashRegisters.push(action.payload);
        },
      )
      .addCase(
        editCashRegister.fulfilled,
        (state, action: PayloadAction<CashRegister>) => {
          const index = state.cashRegisters.findIndex(
            (s) => s.id === action.payload.id,
          );
          if (index !== -1) state.cashRegisters[index] = action.payload;
        },
      )
      .addCase(
        removeCashRegister.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.cashRegisters = state.cashRegisters.filter(
            (t) => t.id !== action.payload,
          );
        },
      )
      .addCase(fetchCashRegisterBalance.fulfilled, (state, action) => {
        state.cashRegisterBalance = action.payload;
      })
      .addCase(openSession.fulfilled, (state, action) => {
        state.sessionId = action.payload.sessionId;
        state.hasOpenSession = true;
      })
      .addCase(closeSession.fulfilled, (state) => {
        state.sessionId = null;
        state.hasOpenSession = false;
      })
      .addCase(getSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(
        getSession.fulfilled,
        (state, action: PayloadAction<GetCashRegisterSession>) => {
          state.isLoading = false;
          state.sessionId = action.payload.hasOpenSession
            ? action.payload.sessionId
            : null;
          state.hasOpenSession = action.payload.hasOpenSession;
        },
      )
      .addCase(getSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to verify session status.";
      });
  },
});

export const { clearError } = cashRegistersSlice.actions;
export default cashRegistersSlice.reducer;
