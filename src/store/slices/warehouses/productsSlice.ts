import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import { getWarehouseProducts } from "@/services/warehouses/warehouseProduct";

// types
import type {
  GetWarehouseProductsParams,
  GetWarehouseProductsResponse,
  WarehouseProductItem,
} from "@/types/warehouses/warehouseProduct";

// utils
import { getApiErrorMessage } from "@/utils";

interface WarehouseProductsState {
  items: WarehouseProductItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WarehouseProductsState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchWarehouseProducts = createAsyncThunk<
  GetWarehouseProductsResponse,
  GetWarehouseProductsParams,
  { rejectValue: string }
>("warehouseProducts/fetchWarehouseProducts", async (params, { rejectWithValue }) => {
  try {
    return await getWarehouseProducts(params);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch warehouse products"),
    );
  }
});

const warehouseProductsSlice = createSlice({
  name: "warehouseProducts",
  initialState,
  reducers: {
    clearWarehouseProductsError: (state) => {
      state.error = null;
    },
    resetWarehouseProductsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchWarehouseProducts.fulfilled,
        (state, action: PayloadAction<GetWarehouseProductsResponse>) => {
          state.isLoading = false;
          state.items = action.payload;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("warehouseProducts/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("warehouseProducts/") &&
          action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.error = action.payload ?? "An unexpected error occurred";
        },
      );
  },
});

export const { clearWarehouseProductsError, resetWarehouseProductsState } =
  warehouseProductsSlice.actions;

export default warehouseProductsSlice.reducer;


