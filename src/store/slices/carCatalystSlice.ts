import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

import { getApiErrorMessage } from "@/utils";
import type {
  CarCatalyst,
  CreateCarCatalyst,
  CarCatalystSearchParams,
} from "@/types/settings";

import {
  createCarCatalyst,
  getCarCatalystById,
  deleteCarCatalyst,
  searchCarCatalysts,
} from "@/services/settings/carCatalyst";

interface CarCatalystState {
  list: CarCatalyst[];
  selected: CarCatalyst | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CarCatalystState = {
  list: [],
  selected: null,
  isLoading: false,
  error: null,
};

export const addCarCatalyst = createAsyncThunk<
  CarCatalyst,
  CreateCarCatalyst,
  { rejectValue: string }
>("carCatalyst/create", async (payload, { rejectWithValue }) => {
  try {
    return await createCarCatalyst(payload);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create car catalyst"),
    );
  }
});

export const fetchCarCatalystById = createAsyncThunk<
  CarCatalyst,
  number,
  { rejectValue: string }
>("carCatalyst/getById", async (id, { rejectWithValue }) => {
  try {
    return await getCarCatalystById(id);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch car catalyst"),
    );
  }
});

export const removeCarCatalyst = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("carCatalyst/delete", async (id, { rejectWithValue }) => {
  try {
    await deleteCarCatalyst(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete car catalyst"),
    );
  }
});

export const fetchCarCatalysts = createAsyncThunk<
  CarCatalyst[],
  CarCatalystSearchParams,
  { rejectValue: string }
>("carCatalyst/search", async (params, { rejectWithValue }) => {
  try {
    return await searchCarCatalysts(params);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to search car catalysts"),
    );
  }
});

const carCatalystSlice = createSlice({
  name: "carCatalyst",
  initialState,
  reducers: {
    clearCarCatalystError: (state) => {
      state.error = null;
    },
    clearSelectedCarCatalyst: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addCarCatalyst.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addCarCatalyst.fulfilled,
        (state, action: PayloadAction<CarCatalyst>) => {
          state.isLoading = false;
          state.list.unshift(action.payload);
        },
      )
      .addCase(addCarCatalyst.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create car catalyst";
      });

    builder
      .addCase(fetchCarCatalystById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCarCatalystById.fulfilled,
        (state, action: PayloadAction<CarCatalyst>) => {
          state.isLoading = false;
          state.selected = action.payload;
        },
      )
      .addCase(fetchCarCatalystById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch car catalyst by id";
      });

    builder
      .addCase(removeCarCatalyst.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeCarCatalyst.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.list = state.list.filter((item) => item.id !== action.payload);
        },
      )
      .addCase(removeCarCatalyst.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete car catalyst";
      });

    builder
      .addCase(fetchCarCatalysts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCarCatalysts.fulfilled,
        (state, action: PayloadAction<CarCatalyst[]>) => {
          state.isLoading = false;
          state.list = action.payload;
        },
      )
      .addCase(fetchCarCatalysts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to search car catalysts";
      });
  },
});

export const { clearCarCatalystError, clearSelectedCarCatalyst } =
  carCatalystSlice.actions;

export default carCatalystSlice.reducer;
