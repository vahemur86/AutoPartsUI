import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getCatalystBuckets,
  createCatalystBucket,
  updateCatalystBucket,
  getCatalystBucketsByCode,
  getCatalystBucketsByGroup,
  getCatalystQuoteGroup,
} from "@/services/settings/catalystBuckets";

// types
import type {
  CatalystBucket,
  CatalystBucketByGroup,
  CatalystBucketQuoteGroup,
} from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface CatalystBucketsState {
  catalystBuckets: CatalystBucket[];
  catalystBucket: CatalystBucket | null;
  catalystBucketsByGroup: CatalystBucketByGroup | null;
  catalystQuoteGroup: CatalystBucketQuoteGroup | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CatalystBucketsState = {
  catalystBuckets: [],
  catalystBucket: null,
  catalystBucketsByGroup: null,
  catalystQuoteGroup: null,
  isLoading: false,
  error: null,
};

type CatalystBucketPayload = {
  code: string;
  weight: number;
  ptWeight: number;
  pdWeight: number;
  rhWeight: number;
};

type CatalystBucketUpdatePayload = CatalystBucketPayload & {
  id: number;
  isActive: boolean;
};

// Async thunk for fetching catalyst buckets
export const fetchCatalystBuckets = createAsyncThunk<
  CatalystBucket[],
  void,
  { rejectValue: string }
>("catalystBuckets/fetchCatalystBuckets", async (_, { rejectWithValue }) => {
  try {
    const data = await getCatalystBuckets();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch catalyst buckets"),
    );
  }
});

export const fetchCatalystBucketsByCode = createAsyncThunk<
  CatalystBucket,
  string,
  { rejectValue: string }
>(
  "catalystBuckets/fetchCatalystBucketsByCode",
  async (code, { rejectWithValue }) => {
    try {
      const data = await getCatalystBucketsByCode(code);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch catalyst buckets by code"),
      );
    }
  },
);

// Async thunk for creating catalyst bucket
export const addCatalystBucket = createAsyncThunk<
  CatalystBucket,
  CatalystBucketPayload,
  { rejectValue: string }
>("catalystBuckets/addCatalystBucket", async (payload, { rejectWithValue }) => {
  try {
    const data = await createCatalystBucket(payload);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create catalyst bucket"),
    );
  }
});

// Async thunk for updating catalyst bucket
export const editCatalystBucket = createAsyncThunk<
  CatalystBucket,
  CatalystBucketUpdatePayload,
  { rejectValue: string }
>(
  "catalystBuckets/updateCatalystBucket",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await updateCatalystBucket(payload.id, {
        code: payload.code,
        weight: payload.weight,
        ptWeight: payload.ptWeight,
        pdWeight: payload.pdWeight,
        rhWeight: payload.rhWeight,
        isActive: payload.isActive,
      });
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update catalyst bucket"),
      );
    }
  },
);

// Async thunk for fetching catalyst buckets by group
export const fetchCatalystBucketsByGroup = createAsyncThunk<
  CatalystBucketByGroup,
  { code: string; cashRegisterId?: number },
  { rejectValue: string }
>(
  "catalystBuckets/fetchCatalystBucketsByGroup",
  async ({ code, cashRegisterId }, { rejectWithValue }) => {
    try {
      const data = await getCatalystBucketsByGroup(code, cashRegisterId);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch catalyst buckets"),
      );
    }
  },
);

// Async thunk for fetching catalyst quote group
export const fetchCatalystQuoteGroup = createAsyncThunk<
  CatalystBucketQuoteGroup,
  { code: string; cashRegisterId?: number },
  { rejectValue: string }
>(
  "catalystBuckets/fetchCatalystQuoteGroup",
  async ({ code, cashRegisterId }, { rejectWithValue }) => {
    try {
      const data = await getCatalystQuoteGroup(code, cashRegisterId);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch catalyst quote group"),
      );
    }
  },
);

const catalystBucketsSlice = createSlice({
  name: "catalystBuckets",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetSearchedBucket: (state) => {
      state.catalystBucket = null;
    },
    resetBucketsByGroup: (state) => {
      state.catalystBucketsByGroup = null;
    },
    resetQuoteGroup: (state) => {
      state.catalystQuoteGroup = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch catalyst buckets
    builder
      .addCase(fetchCatalystBuckets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCatalystBuckets.fulfilled,
        (state, action: PayloadAction<CatalystBucket[]>) => {
          state.isLoading = false;
          state.catalystBuckets = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchCatalystBuckets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch catalyst buckets";
      });

    // Fetch catalyst buckets by code
    builder
      .addCase(fetchCatalystBucketsByCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCatalystBucketsByCode.fulfilled,
        (state, action: PayloadAction<CatalystBucket>) => {
          state.isLoading = false;
          state.catalystBucket = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchCatalystBucketsByCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch catalyst buckets";
      });

    // Add catalyst bucket
    builder
      .addCase(addCatalystBucket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addCatalystBucket.fulfilled,
        (state, action: PayloadAction<CatalystBucket>) => {
          state.isLoading = false;
          state.catalystBuckets.push(action.payload);
          state.error = null;
        },
      )
      .addCase(addCatalystBucket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create catalyst bucket";
      });

    // Update catalyst bucket
    builder
      .addCase(editCatalystBucket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        editCatalystBucket.fulfilled,
        (state, action: PayloadAction<CatalystBucket>) => {
          state.isLoading = false;
          const index = state.catalystBuckets.findIndex(
            (cb) => cb.id === action.payload.id,
          );
          if (index !== -1) {
            state.catalystBuckets[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(editCatalystBucket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update catalyst bucket";
      });

    // Fetch catalyst buckets by group
    builder
      .addCase(fetchCatalystBucketsByGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCatalystBucketsByGroup.fulfilled,
        (state, action: PayloadAction<CatalystBucketByGroup>) => {
          state.isLoading = false;
          state.catalystBucketsByGroup = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchCatalystBucketsByGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch catalyst bucket";
      });

    // Fetch catalyst quote group
    builder
      .addCase(fetchCatalystQuoteGroup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCatalystQuoteGroup.fulfilled,
        (state, action: PayloadAction<CatalystBucketQuoteGroup>) => {
          state.isLoading = false;
          state.catalystQuoteGroup = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchCatalystQuoteGroup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch catalyst quote group";
      });
  },
});

export const {
  clearError,
  resetSearchedBucket,
  resetBucketsByGroup,
  resetQuoteGroup,
} = catalystBucketsSlice.actions;

export default catalystBucketsSlice.reducer;
