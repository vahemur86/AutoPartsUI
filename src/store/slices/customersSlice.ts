import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  deleteCustomer,
  getCustomerNames,
  getCustomers,
  getOrCreateCustomer,
  updateCustomerType as updateCustomerTypeApi,
  type GetCustomersParams,
} from "@/services/customers";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  Customer,
  CreateCustomerRequest,
  CustomersResponse,
} from "@/types/operator";

interface CustomersState {
  items: Customer[];
  totalItems: number;
  isLoading: boolean;
  isSubmitting: boolean;
  names: string[];
  error: string | null;
}

const initialState: CustomersState = {
  items: [],
  names: [],
  totalItems: 0,
  isLoading: false,
  isSubmitting: false,
  error: null,
};

// --- Async Thunks ---

export const fetchCustomers = createAsyncThunk<
  CustomersResponse,
  GetCustomersParams | undefined,
  { rejectValue: string }
>("customers/fetchAll", async (params, { rejectWithValue }) => {
  try {
    return await getCustomers(params);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch customers"),
    );
  }
});

export const createCustomer = createAsyncThunk<
  Customer,
  { data: CreateCustomerRequest; cashRegisterId?: number },
  { rejectValue: string }
>("customers/create", async (payload, { rejectWithValue }) => {
  try {
    return await getOrCreateCustomer(payload);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create customer"),
    );
  }
});

export const removeCustomer = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("customers/removeCustomer", async (customerId, { rejectWithValue }) => {
  try {
    await deleteCustomer(customerId);
    return customerId;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete customer"),
    );
  }
});

export const updateCustomerType = createAsyncThunk<
  Customer,
  { customerId: number; customerTypeId: number },
  { rejectValue: string }
>(
  "customers/updateType",
  async ({ customerId, customerTypeId }, { rejectWithValue }) => {
    try {
      return await updateCustomerTypeApi(customerId, customerTypeId);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update customer type"),
      );
    }
  },
);

export const fetchCustomerNames = createAsyncThunk<
  string[],
  { search?: string; cashRegisterId?: number },
  { rejectValue: string }
>(
  "customers/fetchNames",
  async ({ search, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await getCustomerNames(search, cashRegisterId);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch customer names"),
      );
    }
  },
);

// --- Slice ---

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCustomersState: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* fetchCustomers cases */
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCustomers.fulfilled,
        (state, action: PayloadAction<CustomersResponse>) => {
          console.log(action.payload);
          state.isLoading = false;
          state.items = action.payload.results;
          state.totalItems = action.payload.totalItems;
        },
      )
      .addCase(fetchCustomerNames.fulfilled, (state, action) => {
        state.names = action.payload;
      })
      .addCase(fetchCustomerNames.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to fetch customer names";
      })

      /* createCustomer cases */
      .addCase(createCustomer.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        createCustomer.fulfilled,
        (state, action: PayloadAction<Customer>) => {
          state.isSubmitting = false;
          state.items = [action.payload, ...state.items];
          state.totalItems += 1;
        },
      )

      /* updateCustomerType cases */
      .addCase(updateCustomerType.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(
        updateCustomerType.fulfilled,
        (state, action: PayloadAction<Customer>) => {
          state.isSubmitting = false;
          const index = state.items.findIndex(
            (c) => c.id === action.payload.id,
          );
          if (index !== -1) {
            state.items[index] = action.payload;
          }
        },
      );

    // Delete customer
    builder
      .addCase(removeCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeCustomer.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.items = state.items.filter((ct) => ct.id !== action.payload);
          state.error = null;
        },
      )
      .addCase(removeCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete customer";
      })

      /* Global Rejected Matcher */
      .addMatcher(
        (action): action is PayloadAction<string> =>
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.isLoading = false;
          state.isSubmitting = false;
          state.error = action.payload ?? "An unexpected error occurred";
        },
      );
  },
});

export const { clearError, clearCustomersState } = customersSlice.actions;
export default customersSlice.reducer;
