import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// services
import {
  createIntake,
  getIntake,
  offerIntake as offerIntakeFn,
  acceptIntake as acceptIntakeFn,
  rejectIntake as rejectIntakeFn,
  recalculateIntake as recalculateIntakeFn,
} from "@/services/operator";

// stores
import { logout } from "./authSlice";

// types
import type { Intake, IntakeResponse } from "@/types/operator";

// utils
import { getApiErrorMessage } from "@/utils";

interface IntakeState {
  intake: IntakeResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: IntakeState = {
  intake: null,
  isLoading: false,
  error: null,
};

export const addIntake = createAsyncThunk<
  IntakeResponse,
  { intake: Intake; cashRegisterId: number },
  { rejectValue: string }
>(
  "intakes/addIntake",
  async ({ intake, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await createIntake({ intake, cashRegisterId });
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create intake"),
      );
    }
  },
);

export const fetchIntake = createAsyncThunk<
  IntakeResponse,
  { intakeId: number; cashRegisterId: number },
  { rejectValue: string }
>(
  "intakes/fetchIntake",
  async ({ intakeId, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await getIntake({ intakeId, cashRegisterId });
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch intake"),
      );
    }
  },
);

export const offerIntake = createAsyncThunk<
  Intake,
  { intakeId: number; cashRegisterId: number },
  { rejectValue: string }
>(
  "intakes/offerIntake",
  async ({ intakeId, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await offerIntakeFn({ intakeId, cashRegisterId });
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to offer intake"),
      );
    }
  },
);

export const acceptIntake = createAsyncThunk<
  Intake,
  {
    intakeId: number;
    cashRegisterId: number;
    paymentType?: number;
  },
  { rejectValue: string }
>("intakes/acceptIntake", async (payload, { rejectWithValue }) => {
  try {
    return await acceptIntakeFn(payload);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to accept intake"),
    );
  }
});

export const rejectIntake = createAsyncThunk<
  Intake,
  { intakeId: number; cashRegisterId: number },
  { rejectValue: string }
>(
  "intakes/rejectIntake",
  async ({ intakeId, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await rejectIntakeFn({ intakeId, cashRegisterId });
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to reject intake"),
      );
    }
  },
);

export const recalculateIntake = createAsyncThunk<
  Intake,
  number,
  { rejectValue: string }
>("intakes/recalculateIntake", async (id, { rejectWithValue }) => {
  try {
    return await recalculateIntakeFn(id);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to recalculate intake"),
    );
  }
});

const operatorSlice = createSlice({
  name: "operator",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearIntakeState: (state) => {
      state.intake = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.intake = null;
      state.error = null;
    });

    builder
      .addCase(fetchIntake.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIntake.fulfilled, (state, action) => {
        state.isLoading = false;
        state.intake = action.payload;
      })
      .addCase(fetchIntake.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch intake";
      })
      .addCase(addIntake.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addIntake.fulfilled, (state, action) => {
        state.isLoading = false;
        state.intake = action.payload;
      })
      .addCase(addIntake.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create intake";
      });
  },
});

export const { clearError, clearIntakeState } = operatorSlice.actions;
export default operatorSlice.reducer;
