import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  createVehicleServiceTemplate,
  getVehicleServiceTemplates,
  updateVehicleServiceTemplate,
} from "@/services/settings/workshopPricing";
import type {
  VehicleServiceTemplateCreatePayload,
  VehicleServiceTemplateItem,
  VehicleServiceTemplateUpdatePayload,
} from "@/types/settings";
import { getApiErrorMessage } from "@/utils";

interface VehicleServicePricingState {
  items: VehicleServiceTemplateItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: VehicleServicePricingState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchVehicleServiceTemplates = createAsyncThunk<
  VehicleServiceTemplateItem[],
  { cashRegisterId?: number } | void,
  { rejectValue: string }
>("vehicleServicePricing/fetchAll", async (payload, { rejectWithValue }) => {
  try {
    return await getVehicleServiceTemplates(payload?.cashRegisterId);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch vehicle service templates"),
    );
  }
});

export const addVehicleServiceTemplate = createAsyncThunk<
  VehicleServiceTemplateItem,
  VehicleServiceTemplateCreatePayload,
  { rejectValue: string }
>("vehicleServicePricing/add", async (payload, { rejectWithValue }) => {
  try {
    return await createVehicleServiceTemplate(payload);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create vehicle service template"),
    );
  }
});

export const editVehicleServiceTemplate = createAsyncThunk<
  VehicleServiceTemplateItem,
  VehicleServiceTemplateUpdatePayload,
  { rejectValue: string }
>("vehicleServicePricing/edit", async (payload, { rejectWithValue }) => {
  try {
    return await updateVehicleServiceTemplate(payload);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update vehicle service template"),
    );
  }
});

const vehicleServicePricingSlice = createSlice({
  name: "vehicleServicePricing",
  initialState,
  reducers: {
    clearVehicleServicePricing: (state) => {
      state.items = [];
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicleServiceTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchVehicleServiceTemplates.fulfilled,
        (state, action: PayloadAction<VehicleServiceTemplateItem[]>) => {
          state.isLoading = false;
          state.items = action.payload;
        },
      )
      .addCase(fetchVehicleServiceTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch vehicle service templates";
      })
      .addCase(addVehicleServiceTemplate.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(editVehicleServiceTemplate.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { clearVehicleServicePricing } = vehicleServicePricingSlice.actions;

export default vehicleServicePricingSlice.reducer;
