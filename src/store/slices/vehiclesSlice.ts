import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
// services
import {
  getVehicles,
  createVehicle,
  type CreateVehiclePayload,
} from "@/services/settings/vehicles";
// utils
import { getApiErrorMessage } from "@/utils";
import type { Vehicle } from "@/types/settings";

interface VehiclesState {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
}

const initialState: VehiclesState = {
  vehicles: [],
  isLoading: false,
  error: null,
};

// Async thunk for fetching vehicles
export const fetchVehicles = createAsyncThunk<
  Vehicle[],
  void,
  { rejectValue: string }
>("vehicles/fetchVehicles", async (_, { rejectWithValue }) => {
  try {
    const data = await getVehicles();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch vehicles")
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
      getApiErrorMessage(error, "Failed to create vehicle")
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
        }
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
        }
      )
      .addCase(addVehicle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create vehicle";
      });
  },
});

export const { clearError } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;
