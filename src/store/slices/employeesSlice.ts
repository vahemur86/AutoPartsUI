import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  activateEmployee,
  createEmployee,
  deactivateEmployee,
  getEmployeeById,
  getEmployees,
  getEmployeesByCategory,
  updateEmployee,
} from "@/services/settings/workshopPricing";
import type {
  EmployeeCreatePayload,
  EmployeeItem,
  EmployeeUpdatePayload,
} from "@/types/settings";
import { getApiErrorMessage } from "@/utils";

interface EmployeesState {
  items: EmployeeItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: EmployeesState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchEmployees = createAsyncThunk<
  EmployeeItem[],
  { includeInactive?: boolean } | void,
  { rejectValue: string }
>("employees/fetchAll", async (payload, { rejectWithValue }) => {
  try {
    return await getEmployees(payload?.includeInactive ?? false);
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch employees"));
  }
});

export const fetchEmployeesByCategory = createAsyncThunk<
  EmployeeItem[],
  { categoryId: number; includeInactive?: boolean },
  { rejectValue: string }
>("employees/fetchByCategory", async (payload, { rejectWithValue }) => {
  try {
    return await getEmployeesByCategory(payload.categoryId, payload.includeInactive ?? false);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch employees by category"),
    );
  }
});

export const fetchEmployeeById = createAsyncThunk<
  EmployeeItem,
  number,
  { rejectValue: string }
>("employees/fetchById", async (id, { rejectWithValue }) => {
  try {
    return await getEmployeeById(id);
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch employee"));
  }
});

export const addEmployee = createAsyncThunk<
  EmployeeItem,
  EmployeeCreatePayload,
  { rejectValue: string }
>("employees/add", async (payload, { rejectWithValue }) => {
  try {
    return await createEmployee(payload);
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to create employee"));
  }
});

export const editEmployee = createAsyncThunk<
  EmployeeItem,
  EmployeeUpdatePayload,
  { rejectValue: string }
>("employees/edit", async (payload, { rejectWithValue }) => {
  try {
    return await updateEmployee(payload);
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to update employee"));
  }
});

export const toggleEmployeeActive = createAsyncThunk<
  { id: number; isActive: boolean },
  { id: number; isActive: boolean },
  { rejectValue: string }
>("employees/toggleActive", async ({ id, isActive }, { rejectWithValue }) => {
  try {
    if (isActive) {
      await activateEmployee(id);
    } else {
      await deactivateEmployee(id);
    }
    return { id, isActive };
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to toggle employee status"));
  }
});

const employeesSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action: PayloadAction<EmployeeItem[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch employees";
      })
      .addCase(fetchEmployeesByCategory.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index === -1) {
          state.items.unshift(action.payload);
        } else {
          state.items[index] = action.payload;
        }
      })
      .addCase(addEmployee.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(editEmployee.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(toggleEmployeeActive.fulfilled, (state, action) => {
        const target = state.items.find((item) => item.id === action.payload.id);
        if (target) {
          target.isActive = action.payload.isActive;
        }
      });
  },
});

export default employeesSlice.reducer;
