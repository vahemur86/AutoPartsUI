import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  activateServiceCategory,
  createServiceCategory,
  deactivateServiceCategory,
  getServiceCategoryById,
  getServiceCategories,
  updateServiceCategory,
} from "@/services/settings/workshopPricing";
import type {
  ServiceCategoryCreatePayload,
  ServiceCategoryItem,
  ServiceCategoryUpdatePayload,
} from "@/types/settings";
import { getApiErrorMessage } from "@/utils";

interface ServiceCategoryState {
  items: ServiceCategoryItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ServiceCategoryState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchServiceCategories = createAsyncThunk<
  ServiceCategoryItem[],
  void,
  { rejectValue: string }
>("serviceCategory/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await getServiceCategories();
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch service categories"),
    );
  }
});

export const addServiceCategory = createAsyncThunk<
  ServiceCategoryItem,
  ServiceCategoryCreatePayload,
  { rejectValue: string }
>("serviceCategory/add", async (payload, { rejectWithValue }) => {
  try {
    return await createServiceCategory(payload);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create service category"),
    );
  }
});

export const editServiceCategory = createAsyncThunk<
  ServiceCategoryItem,
  ServiceCategoryUpdatePayload,
  { rejectValue: string }
>("serviceCategory/edit", async (payload, { rejectWithValue }) => {
  try {
    return await updateServiceCategory(payload);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update service category"),
    );
  }
});

export const fetchServiceCategoryById = createAsyncThunk<
  ServiceCategoryItem,
  number,
  { rejectValue: string }
>("serviceCategory/fetchById", async (id, { rejectWithValue }) => {
  try {
    return await getServiceCategoryById(id);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch service category"),
    );
  }
});

export const toggleServiceCategoryActive = createAsyncThunk<
  { id: number; isActive: boolean },
  { id: number; isActive: boolean },
  { rejectValue: string }
>(
  "serviceCategory/toggleActive",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      if (isActive) {
        await activateServiceCategory(id);
      } else {
        await deactivateServiceCategory(id);
      }
      return { id, isActive };
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to change category status"),
      );
    }
  },
);

const serviceCategorySlice = createSlice({
  name: "serviceCategory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServiceCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchServiceCategories.fulfilled,
        (state, action: PayloadAction<ServiceCategoryItem[]>) => {
          state.isLoading = false;
          state.items = action.payload;
        },
      )
      .addCase(fetchServiceCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch service categories";
      })
      .addCase(addServiceCategory.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(fetchServiceCategoryById.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index === -1) {
          state.items.unshift(action.payload);
        } else {
          state.items[index] = action.payload;
        }
      })
      .addCase(editServiceCategory.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(toggleServiceCategoryActive.fulfilled, (state, action) => {
        const target = state.items.find((item) => item.id === action.payload.id);
        if (target) {
          target.isActive = action.payload.isActive;
        }
      });
  },
});

export default serviceCategorySlice.reducer;
