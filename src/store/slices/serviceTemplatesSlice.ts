
console.log("serviceTemplates module loaded");
import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import {
  getServiceTemplates,
  createServiceTemplate,
  updateServiceTemplate as apiUpdateServiceTemplate,
  type ServiceTemplate,
} from "@/services/settings/serviceTemplates";

interface State {
  list: ServiceTemplate[];
  isLoading: boolean;
  error: string | null;
}

const initialState: State = {
  list: [],
  isLoading: false,
  error: null,
};

// GET
export const fetchServiceTemplates = createAsyncThunk<
  ServiceTemplate[]
>("serviceTemplates/fetch", async () => {
  return await getServiceTemplates();
});

// CREATE
export const addServiceTemplate = createAsyncThunk<
  ServiceTemplate,
  ServiceTemplate
>("serviceTemplates/add", async (payload) => {
  return await createServiceTemplate(payload);
});

// UPDATE 👇 NEW
export const updateServiceTemplate = createAsyncThunk<
  ServiceTemplate,
  {
    id: number;
    data: Omit<ServiceTemplate, "id"> & { isActive: boolean };
  }
>("serviceTemplates/update", async ({ id, data }) => {
  return await apiUpdateServiceTemplate(id, data);
});

const serviceTemplatesSlice = createSlice({
  name: "serviceTemplates",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET
      .addCase(fetchServiceTemplates.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchServiceTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchServiceTemplates.rejected, (state) => {
        state.isLoading = false;
      })

      // CREATE
      .addCase(addServiceTemplate.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })

      // UPDATE 👇
      .addCase(updateServiceTemplate.fulfilled, (state, action) => {
        const index = state.list.findIndex(
          (x) => x.id === action.payload.id
        );

        if (index !== -1) {
          state.list[index] = action.payload;
        }
      });
  },
});

export const { clearError } = serviceTemplatesSlice.actions;

export default serviceTemplatesSlice.reducer;