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
  getSingleCatalystBucket,
} from "@/services/settings/catalystBuckets";

// types
import type { CatalystBucket } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface CatalystBucketsState {
  catalystBuckets: CatalystBucket[];
  catalystBucket: CatalystBucket | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CatalystBucketsState = {
  catalystBuckets: [],
  catalystBucket: null,
  isLoading: false,
  error: null,
};

type CatalystBucketPayload = {
  code: string;
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

// Async thunk for fetching catalyst buckets by code
export const fetchCatalystBucketsByCode = createAsyncThunk<
  CatalystBucket[],
  string,
  { rejectValue: string }
>(
  "catalystBuckets/fetchCatalystBucketsByCode",
  async (code, { rejectWithValue }) => {
    try {
      const data = await getCatalystBucketsByCode(code);
      return [data];
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch catalyst buckets by code"),
      );
    }
  },
);

// Async thunk for fetching single catalyst bucket
export const fetchCatalystBucket = createAsyncThunk<
  CatalystBucket,
  { code: string; currencyCode?: string },
  { rejectValue: string }
>(
  "catalystBuckets/fetchCatalystBucket",
  async ({ code, currencyCode }, { rejectWithValue }) => {
    try {
      const data = await getSingleCatalystBucket(code, currencyCode);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch catalyst bucket"),
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
        (state, action: PayloadAction<CatalystBucket[]>) => {
          state.isLoading = false;
          state.catalystBuckets = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchCatalystBucketsByCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch catalyst buckets";
      });

    // Fetch catalyst buckets by code
    builder
      .addCase(fetchCatalystBucket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCatalystBucket.fulfilled,
        (state, action: PayloadAction<CatalystBucket>) => {
          state.isLoading = false;
          state.catalystBucket = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchCatalystBucket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch catalyst bucket";
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
  },
});

export const { clearError } = catalystBucketsSlice.actions;
export default catalystBucketsSlice.reducer;
