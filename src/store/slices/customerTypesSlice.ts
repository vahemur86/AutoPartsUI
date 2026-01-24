import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  createCustomerType,
  getCustomerTypes,
  updateCustomerType,
} from "@/services/settings/customerTypes";

// types
import type { CustomerType } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface CustomerTypesState {
  customerTypes: CustomerType[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CustomerTypesState = {
  customerTypes: [],
  isLoading: false,
  error: null,
};

// Async thunk for fetching customer types
export const fetchCustomerTypes = createAsyncThunk<
  CustomerType[],
  void,
  { rejectValue: string }
>("customerTypes/fetchCustomerTypes", async (_, { rejectWithValue }) => {
  try {
    const data = await getCustomerTypes();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch customer types"),
    );
  }
});

// Async thunk for creating customer type
export const addCustomerType = createAsyncThunk<
  CustomerType,
  Omit<CustomerType, "id" | "isActive">,
  { rejectValue: string }
>("customerTypes/addCustomerType", async (payload, { rejectWithValue }) => {
  try {
    const data = await createCustomerType(payload);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create customer type"),
    );
  }
});

// Async thunk for updating customer type
export const editCustomerType = createAsyncThunk<
  CustomerType,
  Omit<CustomerType, "id"> & { id: number },
  { rejectValue: string }
>(
  "customerTypes/editCustomerType",
  async ({ id, ...rest }, { rejectWithValue }) => {
    try {
      const data = await updateCustomerType(id, rest);
      return data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update customer type"),
      );
    }
  },
);

const customerTypesSlice = createSlice({
  name: "customerTypes",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch customer types
    builder
      .addCase(fetchCustomerTypes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCustomerTypes.fulfilled,
        (state, action: PayloadAction<CustomerType[]>) => {
          state.isLoading = false;
          state.customerTypes = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchCustomerTypes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch customer types";
      });

    // Add customer type
    builder
      .addCase(addCustomerType.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addCustomerType.fulfilled,
        (state, action: PayloadAction<CustomerType>) => {
          state.isLoading = false;
          state.customerTypes.push(action.payload);
          state.error = null;
        },
      )
      .addCase(addCustomerType.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create customer type";
      });

    // Update customer type
    builder
      .addCase(editCustomerType.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        editCustomerType.fulfilled,
        (state, action: PayloadAction<CustomerType>) => {
          state.isLoading = false;
          const index = state.customerTypes.findIndex(
            (s) => s.id === action.payload.id,
          );
          if (index !== -1) {
            state.customerTypes[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(editCustomerType.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update customer type";
      });
  },
});

export const { clearError } = customerTypesSlice.actions;
export default customerTypesSlice.reducer;

