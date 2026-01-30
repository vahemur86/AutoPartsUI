import {
  createSlice,
  createAsyncThunk,
  isRejected,
  isAnyOf,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getOfferIncreaseOptions,
  createOrUpdateOfferIncreaseOption,
  deleteOfferIncreaseOption,
} from "@/services/settings/offerOptions";

// types
import type { OfferIncreaseOption } from "@/types/settings";

interface OfferOptionsState {
  options: OfferIncreaseOption[];
  isLoading: boolean;
  error: string | null;
}

const initialState: OfferOptionsState = {
  options: [],
  isLoading: false,
  error: null,
};

export const fetchOfferOptions = createAsyncThunk<
  OfferIncreaseOption[],
  { shopId: number; cashRegisterId?: number },
  { rejectValue: string }
>("offerOptions/fetchAll", async (params, { rejectWithValue }) => {
  try {
    return await getOfferIncreaseOptions(params);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const saveOfferOption = createAsyncThunk<
  OfferIncreaseOption,
  Parameters<typeof createOrUpdateOfferIncreaseOption>[0],
  { rejectValue: string }
>("offerOptions/save", async (params, { rejectWithValue }) => {
  try {
    return await createOrUpdateOfferIncreaseOption(params);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to save option";
    return rejectWithValue(message);
  }
});

export const deleteOfferOption = createAsyncThunk<
  number,
  Parameters<typeof deleteOfferIncreaseOption>[0] & { id: number },
  { rejectValue: string }
>("offerOptions/delete", async (params, { rejectWithValue }) => {
  try {
    await deleteOfferIncreaseOption(params);
    return params.id;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete option";
    return rejectWithValue(message);
  }
});

const offerOptionsSlice = createSlice({
  name: "offerOptions",
  initialState,
  reducers: {
    clearOfferError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchOfferOptions.fulfilled,
        (state, action: PayloadAction<OfferIncreaseOption[]>) => {
          state.options = action.payload;
        },
      )
      .addCase(saveOfferOption.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(
        deleteOfferOption.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.options = state.options.filter((o) => o.id !== action.payload);
        },
      )
      .addMatcher(
        isAnyOf(
          fetchOfferOptions.pending,
          saveOfferOption.pending,
          deleteOfferOption.pending,
        ),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        isAnyOf(
          fetchOfferOptions.fulfilled,
          saveOfferOption.fulfilled,
          deleteOfferOption.fulfilled,
        ),
        (state) => {
          state.isLoading = false;
        },
      )
      .addMatcher(
        isRejected(fetchOfferOptions, saveOfferOption, deleteOfferOption),
        (state, action) => {
          state.isLoading = false;
          state.error = action.payload ?? "An unexpected error occurred";
        },
      );
  },
});

export const { clearOfferError } = offerOptionsSlice.actions;
export default offerOptionsSlice.reducer;
