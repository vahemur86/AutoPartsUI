
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

import {
  getServiceTemplates,
  createServiceTemplate,
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

const serviceTemplatesSlice = createSlice({
  name: "serviceTemplates",
  initialState, // 🔥 սա պարտադիր է
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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

      .addCase(addServiceTemplate.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      });
  },
});

export const { clearError } = serviceTemplatesSlice.actions;

export default serviceTemplatesSlice.reducer;