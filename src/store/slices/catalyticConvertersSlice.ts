import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  createCatalyticConverter,
  createCatalyticPurchase,
  updateCatalyticConverter,
  getCatalyticConverters,
  getCatalyticConverterById,
} from "@/services/settings/catalyticConverters";

// types
import type {
  CreateCatalyticConverterRequest,
  CreateCatalyticPurchaseRequest,
  UpdateCatalyticConverterRequest,
  GetCatalyticConvertersParams,
  GetCatalyticConvertersResponse,
  CatalyticConverterDetailsDto,
} from "@/types/catalyticConverters";

// utils
import { getApiErrorMessage } from "@/utils";

interface CatalyticConvertersState {
  items: GetCatalyticConvertersResponse["results"];
  totalItems: number;
  page: number;
  pageSize: number;
  selected: CatalyticConverterDetailsDto | null;
  isLoading: boolean;
  isLoadingDetails: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: CatalyticConvertersState = {
  items: [],
  totalItems: 0,
  page: 1,
  pageSize: 50,
  selected: null,
  isLoading: false,
  isLoadingDetails: false,
  isSubmitting: false,
  error: null,
};

export const fetchCatalyticConverters = createAsyncThunk<
  GetCatalyticConvertersResponse,
  GetCatalyticConvertersParams | undefined,
  { rejectValue: string }
>(
  "catalyticConverters/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      return await getCatalyticConverters(params);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch catalytic converters"),
      );
    }
  },
);

export const editCatalyticConverter = createAsyncThunk<
  void,
  { id: number; payload: UpdateCatalyticConverterRequest },
  { rejectValue: string }
>(
  "catalyticConverters/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      await updateCatalyticConverter(id, payload);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update catalytic converter"),
      );
    }
  },
);

export const fetchCatalyticConverterById = createAsyncThunk<
  CatalyticConverterDetailsDto,
  number,
  { rejectValue: string }
>(
  "catalyticConverters/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await getCatalyticConverterById(id);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch catalytic converter"),
      );
    }
  },
);

export const addCatalyticConverter = createAsyncThunk<
  number,
  CreateCatalyticConverterRequest,
  { rejectValue: string }
>(
  "catalyticConverters/create",
  async (payload, { rejectWithValue }) => {
    try {
      return await createCatalyticConverter(payload);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create catalytic converter"),
      );
    }
  },
);

export const addCatalyticPurchase = createAsyncThunk<
  number,
  CreateCatalyticPurchaseRequest,
  { rejectValue: string }
>(
  "catalyticConverters/createPurchase",
  async (payload, { rejectWithValue }) => {
    try {
      return await createCatalyticPurchase(payload);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create purchase"),
      );
    }
  },
);

const catalyticConvertersSlice = createSlice({
  name: "catalyticConverters",
  initialState,
  reducers: {
    clearSelectedCatalyticConverter: (state) => {
      state.selected = null;
    },
    clearCatalyticConvertersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalyticConverters.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCatalyticConverters.fulfilled,
        (state, action: PayloadAction<GetCatalyticConvertersResponse>) => {
          state.isLoading = false;
          state.items = action.payload.results;
          state.totalItems = action.payload.totalItems;
          state.page = action.payload.page;
          state.pageSize = action.payload.pageSize;
        },
      )
      .addCase(fetchCatalyticConverters.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch catalytic converters";
      })

      .addCase(fetchCatalyticConverterById.pending, (state) => {
        state.isLoadingDetails = true;
        state.error = null;
      })
      .addCase(
        fetchCatalyticConverterById.fulfilled,
        (state, action: PayloadAction<CatalyticConverterDetailsDto>) => {
          state.isLoadingDetails = false;
          state.selected = action.payload;
        },
      )
      .addCase(fetchCatalyticConverterById.rejected, (state, action) => {
        state.isLoadingDetails = false;
        state.error = action.payload ?? "Failed to fetch catalytic converter";
      })

      .addCase(addCatalyticConverter.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(addCatalyticConverter.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(addCatalyticConverter.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? "Failed to create catalytic converter";
      })

      .addCase(editCatalyticConverter.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(editCatalyticConverter.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(editCatalyticConverter.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? "Failed to update catalytic converter";
      })

      .addCase(addCatalyticPurchase.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(addCatalyticPurchase.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(addCatalyticPurchase.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? "Failed to create purchase";
      });
  },
});

export const {
  clearSelectedCatalyticConverter,
  clearCatalyticConvertersError,
} = catalyticConvertersSlice.actions;

export default catalyticConvertersSlice.reducer;
