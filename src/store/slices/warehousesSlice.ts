import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from "@/services/settings/warehouses";
import type { Warehouse } from "@/types.ts/settings";

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

// Async thunk for fetching warehouses
export const fetchWarehouses = createAsyncThunk(
  "warehouses/fetchWarehouses",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getWarehouses();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch warehouses");
    }
  }
);

// Async thunk for creating warehouse
export const addWarehouse = createAsyncThunk(
  "warehouses/addWarehouse",
  async (code: string, { rejectWithValue }) => {
    try {
      const data = await createWarehouse(code);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create warehouse");
    }
  }
);

// Async thunk for updating warehouse
export const updateWarehouseInStore = createAsyncThunk(
  "warehouses/updateWarehouse",
  async ({ id, code }: { id: number; code: string }, { rejectWithValue }) => {
    try {
      const data = await updateWarehouse(id, code);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update warehouse");
    }
  }
);

// Async thunk for deleting warehouse
export const removeWarehouse = createAsyncThunk(
  "warehouses/removeWarehouse",
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteWarehouse(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete warehouse");
    }
  }
);

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
        }
      )
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
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
        }
      )
      .addCase(addWarehouse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
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
            (w) => w.id === action.payload.id
          );
          if (index !== -1) {
            state.warehouses[index] = action.payload;
          }
          state.error = null;
        }
      )
      .addCase(updateWarehouseInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
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
            (w) => w.id !== action.payload
          );
          state.error = null;
        }
      )
      .addCase(removeWarehouse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = warehousesSlice.actions;
export default warehousesSlice.reducer;
