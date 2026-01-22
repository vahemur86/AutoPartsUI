import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getVehicles,
  createVehicle,
  getVehicleBuckets,
  updateVehicleBuckets,
} from "@/services/settings/vehicles";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { CreateVehiclePayload, Vehicle } from "@/types/settings";

interface VehiclesState {
  vehicles: Vehicle[];
  vehicleBuckets: { vehicleDefinitionId: number; bucketIds: number[] };
  isLoading: boolean;
  error: string | null;
}

const initialState: VehiclesState = {
  vehicles: [],
  vehicleBuckets: { vehicleDefinitionId: 0, bucketIds: [] },
  isLoading: false,
  error: null,
};

// Async thunk for fetching vehicles
export const fetchVehicles = createAsyncThunk<
  Vehicle[],
  boolean | undefined,
  { rejectValue: string }
>("vehicles/fetchVehicles", async (withBuckets, { rejectWithValue }) => {
  try {
    const data = await getVehicles(withBuckets);

    // Backend returns: { totalItems, page, pageSize, results: [...] }
    const vehicles: Vehicle[] = Array.isArray(data?.results)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.results.map((item: any) => ({
          id: String(item.id),
          brand: item.brand?.name ?? "",
          model: item.model?.name ?? "",
          year: item.year ?? 0,
          engine: item.engine?.name ?? "",
          fuelType: item.fuelType?.name ?? "",
        }))
      : [];

    return vehicles;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch vehicles"),
    );
  }
});

// Async thunk for creating vehicle
export const addVehicle = createAsyncThunk<
  Vehicle,
  CreateVehiclePayload,
  { rejectValue: string }
>("vehicles/addVehicle", async (payload, { rejectWithValue }) => {
  try {
    const data = await createVehicle(payload);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create vehicle"),
    );
  }
});

// Async thunk for fetching vehicle buckets
export const fetchVehicleBuckets = createAsyncThunk<
  { vehicleDefinitionId: number; bucketIds: number[] },
  string,
  { rejectValue: string }
>("vehicles/fetchVehicleBuckets", async (vehicleId, { rejectWithValue }) => {
  try {
    const data = await getVehicleBuckets(vehicleId);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch vehicle buckets"),
    );
  }
});

// Async thunk for updating vehicle buckets
export const editVehicleBuckets = createAsyncThunk<
  { vehicleDefinitionId: number; bucketIds: number[] },
  { vehicleId: string; bucketIds: number[] },
  { rejectValue: string }
>("vehicles/editVehicleBuckets", async (params, { rejectWithValue }) => {
  try {
    await updateVehicleBuckets(params);
    return {
      vehicleDefinitionId: Number(params.vehicleId),
      bucketIds: params.bucketIds,
    };
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update vehicle buckets"),
    );
  }
});

const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch vehicles
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchVehicles.fulfilled,
        (state, action: PayloadAction<Vehicle[]>) => {
          state.isLoading = false;
          state.vehicles = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch vehicles";
      });

    // Add vehicle
    builder
      .addCase(addVehicle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addVehicle.fulfilled,
        (state, action: PayloadAction<Vehicle>) => {
          state.isLoading = false;
          state.vehicles.push(action.payload);
          state.error = null;
        },
      )
      .addCase(addVehicle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create vehicle";
      });

    // Fetch vehicle buckets
    builder
      .addCase(fetchVehicleBuckets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchVehicleBuckets.fulfilled,
        (
          state,
          action: PayloadAction<{
            vehicleDefinitionId: number;
            bucketIds: number[];
          }>,
        ) => {
          state.isLoading = false;
          state.vehicleBuckets = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchVehicleBuckets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch vehicle buckets";
      });

    // Update vehicle buckets
    builder
      .addCase(editVehicleBuckets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editVehicleBuckets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vehicleBuckets = action.payload;
        state.error = null;
      })
      .addCase(editVehicleBuckets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update vehicle buckets";
      });
  },
});

export const { clearError } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;
