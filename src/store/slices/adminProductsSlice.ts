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

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  IronPurchase,
  IronDropdownItem,
  GetIronPurchasesParams,
  BuyIronPayload,
  UpdateProductPricePayload,
  OrderLinePayload,
} from "@/types/adminProducts";

// Assuming standard structure for Iron Product list based on your UI needs
export interface IronProduct {
  id: number;
  name: string;
  code: string;
  unitPrice?: number;
}

interface AdminProductsState {
  purchases: IronPurchase[];
  dropdownItems: IronDropdownItem[];
  ironProducts: IronProduct[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: AdminProductsState = {
  purchases: [],
  dropdownItems: [],
  ironProducts: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
};

interface FetchPurchasesArgs {
  params: GetIronPurchasesParams;
  cashRegisterId: number;
}

// GET Endpoints
export const fetchIronPurchases = createAsyncThunk<
  IronPurchase[],
  FetchPurchasesArgs,
  { rejectValue: string }
>(
  "adminProducts/fetchPurchases",
  async ({ params, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await getIronPurchases(params, cashRegisterId);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch purchases"),
      );
    }
  },
);

export const fetchIronDropdown = createAsyncThunk<
  IronDropdownItem[],
  {
    cashRegisterId: number;
    lang: string;
  },
  { rejectValue: string }
>("adminProducts/fetchDropdown", async (payload, { rejectWithValue }) => {
  try {
    return await getIronDropdown(payload);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch dropdown"),
    );
  }
});

export const fetchIronProducts = createAsyncThunk<
  IronProduct[],
  number,
  { rejectValue: string }
>(
  "adminProducts/fetchIronProducts",
  async (cashRegisterId, { rejectWithValue }) => {
    try {
      return await getIronProducts(cashRegisterId);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch iron products"),
      );
    }
  },
);

// POST Endpoints
export const addIronEntry = createAsyncThunk<
  void, // Assuming the API returns a simple success or empty body
  { payload: BuyIronPayload; cashRegisterId: number },
  { rejectValue: string }
>(
  "adminProducts/addIronEntry",
  async ({ payload, cashRegisterId }, { rejectWithValue }) => {
    try {
      await buyIron(payload, cashRegisterId);
    } catch (error: unknown) {
      console.log(error);
      return rejectWithValue(getApiErrorMessage(error, "Failed to buy iron"));
    }
  },
);

export const changeProductPrice = createAsyncThunk<
  void,
  {
    productId: number;
    payload: UpdateProductPricePayload;
    cashRegisterId: number;
  },
  { rejectValue: string }
>(
  "adminProducts/changeProductPrice",
  async ({ productId, payload, cashRegisterId }, { rejectWithValue }) => {
    try {
      await updateProductPrice(productId, payload, cashRegisterId);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update price"),
      );
    }
  },
);

export const addOrderLine = createAsyncThunk<
  void,
  { payload: OrderLinePayload; cashRegisterId: number },
  { rejectValue: string }
>(
  "adminProducts/addOrderLine",
  async ({ payload, cashRegisterId }, { rejectWithValue }) => {
    try {
      await createOrderLine(payload, cashRegisterId);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create order line"),
      );
    }
  },
);

const adminProductsSlice = createSlice({
  name: "adminProducts",
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 1. Specific Case Handlers ALWAYS go first
    builder
      .addCase(
        fetchIronPurchases.fulfilled,
        (state, action: PayloadAction<IronPurchase[]>) => {
          state.isLoading = false;
          state.purchases = action.payload;
        },
      )
      .addCase(
        fetchIronDropdown.fulfilled,
        (state, action: PayloadAction<IronDropdownItem[]>) => {
          state.isLoading = false;
          state.dropdownItems = action.payload;
        },
      )
      .addCase(
        fetchIronProducts.fulfilled,
        (state, action: PayloadAction<IronProduct[]>) => {
          state.isLoading = false;
          state.ironProducts = action.payload;
        },
      );

    // 2. Matchers go after all .addCase calls
    builder
      .addMatcher(
        (action) =>
          action.type.endsWith("/pending") &&
          !action.type.includes("add") &&
          !action.type.includes("change"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.endsWith("/pending") &&
          (action.type.includes("add") || action.type.includes("change")),
        (state) => {
          state.isSubmitting = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) => action.type.endsWith("/fulfilled"),
        (state) => {
          state.isSubmitting = false;
          state.isLoading = false;
        },
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isSubmitting = false;
          state.error = action.payload ?? "An error occurred";
        },
      );
  },
});

export const { clearAdminError } = adminProductsSlice.actions;
export default adminProductsSlice.reducer;
