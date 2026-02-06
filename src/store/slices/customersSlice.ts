import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
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
  error: string | null;
}

const initialState: CustomersState = {
  items: [],
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

// --- Slice ---

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    clearError: (state) => {
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
      )

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

export const { clearError } = customersSlice.actions;
export default customersSlice.reducer;
