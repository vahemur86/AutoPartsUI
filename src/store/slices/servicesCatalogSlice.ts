import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  activateService,
  createService,
  deactivateService,
  getServiceById,
  getServices,
  getServicesByCategory,
  updateService,
  updateServiceInternalCost,
} from "@/services/settings/workshopPricing";
import type {
  ServiceCatalogItem,
  ServiceCreatePayload,
  ServiceUpdatePayload,
} from "@/types/settings";
import { getApiErrorMessage } from "@/utils";

interface ServicesCatalogState {
  items: ServiceCatalogItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ServicesCatalogState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchServicesCatalog = createAsyncThunk<
  ServiceCatalogItem[],
  void,
  { rejectValue: string }
>("servicesCatalog/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await getServices();
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch services"));
  }
});

export const fetchServicesByCategory = createAsyncThunk<
  ServiceCatalogItem[],
  number,
  { rejectValue: string }
>("servicesCatalog/fetchByCategory", async (categoryId, { rejectWithValue }) => {
  try {
    return await getServicesByCategory(categoryId);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch services by category"),
    );
  }
});

export const addServiceCatalogItem = createAsyncThunk<
  ServiceCatalogItem,
  ServiceCreatePayload,
  { rejectValue: string }
>("servicesCatalog/add", async (payload, { rejectWithValue }) => {
  try {
    return await createService(payload);
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to create service"));
  }
});

export const editServiceCatalogItem = createAsyncThunk<
  ServiceCatalogItem,
  ServiceUpdatePayload,
  { rejectValue: string }
>("servicesCatalog/edit", async (payload, { rejectWithValue }) => {
  try {
    return await updateService(payload);
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to update service"));
  }
});

export const fetchServiceById = createAsyncThunk<
  ServiceCatalogItem,
  number,
  { rejectValue: string }
>("servicesCatalog/fetchById", async (id, { rejectWithValue }) => {
  try {
    return await getServiceById(id);
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch service"));
  }
});

export const patchServiceInternalCost = createAsyncThunk<
  ServiceCatalogItem,
  { id: number; internalCost: number },
  { rejectValue: string }
>("servicesCatalog/patchInternalCost", async ({ id, internalCost }, { rejectWithValue }) => {
  try {
    return await updateServiceInternalCost(id, internalCost);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update internal cost"),
    );
  }
});

export const toggleServiceCatalogActive = createAsyncThunk<
  { id: number; isActive: boolean },
  { id: number; isActive: boolean },
  { rejectValue: string }
>(
  "servicesCatalog/toggleActive",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      if (isActive) {
        await activateService(id);
      } else {
        await deactivateService(id);
      }
      return { id, isActive };
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to change service status"),
      );
    }
  },
);

const servicesCatalogSlice = createSlice({
  name: "servicesCatalog",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServicesCatalog.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchServicesCatalog.fulfilled,
        (state, action: PayloadAction<ServiceCatalogItem[]>) => {
          state.isLoading = false;
          state.items = action.payload;
        },
      )
      .addCase(fetchServicesCatalog.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch services";
      })
      .addCase(fetchServicesByCategory.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(fetchServiceById.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index === -1) {
          state.items.unshift(action.payload);
        } else {
          state.items[index] = action.payload;
        }
      })
      .addCase(addServiceCatalogItem.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(editServiceCatalogItem.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(patchServiceInternalCost.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(toggleServiceCatalogActive.fulfilled, (state, action) => {
        const target = state.items.find((item) => item.id === action.payload.id);
        if (target) {
          target.isActive = action.payload.isActive;
        }
      });
  },
});

export default servicesCatalogSlice.reducer;
