import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getIronPurchases,
  getIronDropdown,
  buyIron,
  updateProductPrice,
  createOrderLine,
  getIronProducts,
} from "@/services/adminProducts";

// types
import type {
  IronDropdownItem,
  IronPurchaseResponse,
} from "@/types/adminProducts";

// utils
import { getApiErrorMessage } from "@/utils";

export interface IronProduct {
  id: number;
  name: string;
  code: string;
  unitPrice?: number;
}

interface AdminProductsState {
  purchases: IronPurchaseResponse | null;
  dropdownItems: IronDropdownItem[];
  ironProducts: IronProduct[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: AdminProductsState = {
  purchases: null,
  dropdownItems: [],
  ironProducts: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
};

// --- Async Thunks ---

export const fetchIronPurchases = createAsyncThunk<
  IronPurchaseResponse,
  { params: Parameters<typeof getIronPurchases>[0]; cashRegisterId?: number },
  { rejectValue: string }
>(
  "adminProducts/fetchPurchases",
  async ({ params, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await getIronPurchases(params, cashRegisterId as number);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch purchases"),
      );
    }
  },
);

export const fetchIronDropdown = createAsyncThunk<
  IronDropdownItem[],
  Parameters<typeof getIronDropdown>[0],
  { rejectValue: string }
>("adminProducts/fetchDropdown", async (payload, { rejectWithValue }) => {
  try {
    return await getIronDropdown(payload);
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch dropdown"),
    );
  }
});

export const fetchIronProducts = createAsyncThunk<
  IronProduct[],
  Parameters<typeof getIronProducts>[0],
  { rejectValue: string }
>(
  "adminProducts/fetchIronProducts",
  async (cashRegisterId, { rejectWithValue }) => {
    try {
      return await getIronProducts(cashRegisterId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch iron products"),
      );
    }
  },
);

export const addIronEntry = createAsyncThunk<
  void,
  { payload: Parameters<typeof buyIron>[0]; cashRegisterId: number },
  { rejectValue: string }
>(
  "adminProducts/addIronEntry",
  async ({ payload, cashRegisterId }, { rejectWithValue }) => {
    try {
      await buyIron(payload, cashRegisterId);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Failed to buy iron"));
    }
  },
);

export const changeProductPrice = createAsyncThunk<
  void,
  {
    productId: number;
    payload: Parameters<typeof updateProductPrice>[1];
    cashRegisterId: number;
  },
  { rejectValue: string }
>(
  "adminProducts/changeProductPrice",
  async ({ productId, payload, cashRegisterId }, { rejectWithValue }) => {
    try {
      await updateProductPrice(productId, payload, cashRegisterId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update price"),
      );
    }
  },
);

export const addOrderLine = createAsyncThunk<
  void,
  { payload: Parameters<typeof createOrderLine>[0]; cashRegisterId: number },
  { rejectValue: string }
>(
  "adminProducts/addOrderLine",
  async ({ payload, cashRegisterId }, { rejectWithValue }) => {
    try {
      await createOrderLine(payload, cashRegisterId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create order line"),
      );
    }
  },
);

// --- Slice ---

const adminProductsSlice = createSlice({
  name: "adminProducts",
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    resetAdminProductsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // GET Fulfillment
      .addCase(fetchIronPurchases.fulfilled, (state, action) => {
        state.isLoading = false;
        state.purchases = action.payload;
      })
      .addCase(fetchIronDropdown.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dropdownItems = action.payload;
      })
      .addCase(fetchIronProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ironProducts = action.payload;
      })
      // POST Fulfillment
      .addCase(addIronEntry.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(changeProductPrice.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(addOrderLine.fulfilled, (state) => {
        state.isSubmitting = false;
      })

      // Global Matchers
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state, action) => {
          const isPost =
            action.type.includes("add") || action.type.includes("change");
          if (isPost) {
            state.isSubmitting = true;
          } else {
            state.isLoading = true;
          }
          state.error = null;
        },
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isSubmitting = false;
          state.error = action.payload ?? "An unexpected error occurred";
        },
      );
  },
});

export const { clearAdminError, resetAdminProductsState } =
  adminProductsSlice.actions;
export default adminProductsSlice.reducer;
