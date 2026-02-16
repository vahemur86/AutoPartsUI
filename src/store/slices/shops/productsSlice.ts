import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import { getShopProducts } from "@/services/warehouses/warehouseProduct";

// types
import type {
  GetShopProductsParams,
  GetShopProductsResponse,
  ShopProductItem,
} from "@/types/warehouses/warehouseProduct";

// utils
import { getApiErrorMessage } from "@/utils";

interface ShopProductsState {
  items: ShopProductItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ShopProductsState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchShopProducts = createAsyncThunk<
  GetShopProductsResponse,
  GetShopProductsParams,
  { rejectValue: string }
>(
  "shopProducts/fetchShopProducts",
  async (params, { rejectWithValue }) => {
    try {
      return await getShopProducts(params);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch shop products"),
      );
    }
  },
);

const shopProductsSlice = createSlice({
  name: "shopProducts",
  initialState,
  reducers: {
    clearShopProductsError: (state) => {
      state.error = null;
    },
    resetShopProductsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchShopProducts.fulfilled,
        (state, action: PayloadAction<GetShopProductsResponse>) => {
          state.isLoading = false;
          state.items = action.payload;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("shopProducts/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("shopProducts/") &&
          action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.error = action.payload ?? "An unexpected error occurred";
        },
      );
  },
});

export const { clearShopProductsError, resetShopProductsState } =
  shopProductsSlice.actions;
export default shopProductsSlice.reducer;

