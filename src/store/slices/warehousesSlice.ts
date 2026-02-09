import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "@/services/settings/warehouses";
import {
  addProductToWarehouse as addProductToWarehouseService,
  transferProduct as transferProductService,
} from "@/services/warehouses/warehouseProduct";

// types
import type { Warehouse } from "@/types/settings";
import type {
  AddProductToWarehouseRequest,
  AddProductToWarehouseResponse,
  TransferProductRequest,
  TransferProductResponse,
} from "@/types/warehouses/warehouseProduct";

// utils
import { getApiErrorMessage } from "@/utils";

interface WarehousesState {
  warehouses: Warehouse[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WarehousesState = {
  warehouses: [],
  isLoading: false,
  error: null,
};

type WarehouseUpdatePayload = {
  id: number;
  code: string;
};

// Async thunk for fetching warehouses
export const fetchWarehouses = createAsyncThunk<
  Warehouse[],
  void,
  { rejectValue: string }
>("warehouses/fetchWarehouses", async (_, { rejectWithValue }) => {
  try {
    const data = await getWarehouses();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch warehouses"),
    );
  }
});

// Async thunk for creating warehouse
export const addWarehouse = createAsyncThunk<
  Warehouse,
  string,
  { rejectValue: string }
>("warehouses/addWarehouse", async (code, { rejectWithValue }) => {
  try {
    const data = await createWarehouse(code);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create warehouse"),
    );
  }
});

// Async thunk for updating warehouse
export const updateWarehouseInStore = createAsyncThunk<
  Warehouse,
  WarehouseUpdatePayload,
  { rejectValue: string }
>("warehouses/updateWarehouse", async ({ id, code }, { rejectWithValue }) => {
  try {
    const data = await updateWarehouse(id, code);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update warehouse"),
    );
  }
});

// Async thunk for deleting warehouse
export const removeWarehouse = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("warehouses/removeWarehouse", async (id, { rejectWithValue }) => {
  try {
    await deleteWarehouse(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete warehouse"),
    );
  }
});

// Async thunk for adding product to warehouse
export const addProductToWarehouse = createAsyncThunk<
  AddProductToWarehouseResponse,
  AddProductToWarehouseRequest,
  { rejectValue: string }
>("warehouses/addProductToWarehouse", async (request, { rejectWithValue }) => {
  try {
    const data = await addProductToWarehouseService(request);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to add product to warehouse"),
    );
  }
});

// Async thunk for transferring product
export const transferProduct = createAsyncThunk<
  TransferProductResponse,
  TransferProductRequest,
  { rejectValue: string }
>("warehouses/transferProduct", async (request, { rejectWithValue }) => {
  try {
    const data = await transferProductService(request);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to transfer product"),
    );
  }
});

const warehousesSlice = createSlice({
  name: "warehouses",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch warehouses
    builder
      .addCase(fetchWarehouses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchWarehouses.fulfilled,
        (state, action: PayloadAction<Warehouse[]>) => {
          state.isLoading = false;
          state.warehouses = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch warehouses";
      });

    // Add warehouse
    builder
      .addCase(addWarehouse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addWarehouse.fulfilled,
        (state, action: PayloadAction<Warehouse>) => {
          state.isLoading = false;
          state.warehouses.push(action.payload);
          state.error = null;
        },
      )
      .addCase(addWarehouse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create warehouse";
      });

    // Update warehouse
    builder
      .addCase(updateWarehouseInStore.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateWarehouseInStore.fulfilled,
        (state, action: PayloadAction<Warehouse>) => {
          state.isLoading = false;
          const index = state.warehouses.findIndex(
            (w) => w.id === action.payload.id,
          );
          if (index !== -1) {
            state.warehouses[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(updateWarehouseInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update warehouse";
      });

    // Delete warehouse
    builder
      .addCase(removeWarehouse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeWarehouse.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.warehouses = state.warehouses.filter(
            (w) => w.id !== action.payload,
          );
          state.error = null;
        },
      )
      .addCase(removeWarehouse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete warehouse";
      });

    // Add product to warehouse
    builder
      .addCase(addProductToWarehouse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addProductToWarehouse.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addProductToWarehouse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to add product to warehouse";
      });

    // Transfer product
    builder
      .addCase(transferProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(transferProduct.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(transferProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to transfer product";
      });
  },
});

export const { clearError } = warehousesSlice.actions;
export default warehousesSlice.reducer;
