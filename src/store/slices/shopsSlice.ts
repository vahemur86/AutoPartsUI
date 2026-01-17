import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getShops,
  createShop,
  updateShop,
  deleteShop,
} from "@/services/settings/shop";

// types
import type { Shop } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface ShopsState {
  shops: Shop[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ShopsState = {
  shops: [],
  isLoading: false,
  error: null,
};

type ShopPayload = {
  code: string;
  warehouseId: number;
};

type ShopUpdatePayload = ShopPayload & { id: number };

// Async thunk for fetching shops
export const fetchShops = createAsyncThunk<
  Shop[],
  void,
  { rejectValue: string }
>("shops/fetchShops", async (_, { rejectWithValue }) => {
  try {
    const data = await getShops();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch shops"));
  }
});

// Async thunk for creating shop
export const addShop = createAsyncThunk<
  Shop,
  ShopPayload,
  { rejectValue: string }
>("shops/addShop", async (payload, { rejectWithValue }) => {
  try {
    const data = await createShop(payload.code, payload.warehouseId);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to create shop"));
  }
});

// Async thunk for updating shop
export const updateShopInStore = createAsyncThunk<
  Shop,
  ShopUpdatePayload,
  { rejectValue: string }
>("shops/updateShop", async (payload, { rejectWithValue }) => {
  try {
    const data = await updateShop(
      payload.id,
      payload.code,
      payload.warehouseId,
    );
    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to update shop"));
  }
});

// Async thunk for deleting shop
export const removeShop = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("shops/removeShop", async (id, { rejectWithValue }) => {
  try {
    await deleteShop(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to delete shop"));
  }
});

const shopsSlice = createSlice({
  name: "shops",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch shops
    builder
      .addCase(fetchShops.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchShops.fulfilled, (state, action: PayloadAction<Shop[]>) => {
        state.isLoading = false;
        state.shops = action.payload;
        state.error = null;
      })
      .addCase(fetchShops.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch shops";
      });

    // Add shop
    builder
      .addCase(addShop.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addShop.fulfilled, (state, action: PayloadAction<Shop>) => {
        state.isLoading = false;
        state.shops.push(action.payload);
        state.error = null;
      })
      .addCase(addShop.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create shop";
      });

    // Update shop
    builder
      .addCase(updateShopInStore.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateShopInStore.fulfilled,
        (state, action: PayloadAction<Shop>) => {
          state.isLoading = false;
          const index = state.shops.findIndex(
            (s) => s.id === action.payload.id,
          );
          if (index !== -1) {
            state.shops[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(updateShopInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update shop";
      });

    // Delete shop
    builder
      .addCase(removeShop.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeShop.fulfilled, (state, action: PayloadAction<number>) => {
        state.isLoading = false;
        state.shops = state.shops.filter((s) => s.id !== action.payload);
        state.error = null;
      })
      .addCase(removeShop.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete shop";
      });
  },
});

export const { clearError } = shopsSlice.actions;
export default shopsSlice.reducer;
