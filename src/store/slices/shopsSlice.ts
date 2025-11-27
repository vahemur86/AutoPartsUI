import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  getShops,
  createShop,
  updateShop,
  deleteShop,
} from "@/services/settings/shop";
import type { Shop } from "@/types.ts/settings";

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

// Async thunk for fetching shops
export const fetchShops = createAsyncThunk(
  "shops/fetchShops",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getShops();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch shops");
    }
  }
);

// Async thunk for creating shop
export const addShop = createAsyncThunk(
  "shops/addShop",
  async (
    { code, warehouseId }: { code: string; warehouseId: number },
    { rejectWithValue }
  ) => {
    try {
      const data = await createShop(code, warehouseId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create shop");
    }
  }
);

// Async thunk for updating shop
export const updateShopInStore = createAsyncThunk(
  "shops/updateShop",
  async (
    {
      id,
      code,
      warehouseId,
    }: { id: number; code: string; warehouseId: number },
    { rejectWithValue }
  ) => {
    try {
      const data = await updateShop(id, code, warehouseId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update shop");
    }
  }
);

// Async thunk for deleting shop
export const removeShop = createAsyncThunk(
  "shops/removeShop",
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteShop(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete shop");
    }
  }
);

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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
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
            (s) => s.id === action.payload.id
          );
          if (index !== -1) {
            state.shops[index] = action.payload;
          }
          state.error = null;
        }
      )
      .addCase(updateShopInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
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
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = shopsSlice.actions;
export default shopsSlice.reducer;
