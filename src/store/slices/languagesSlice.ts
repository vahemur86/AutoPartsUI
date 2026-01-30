import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
} from "@/services/settings/languages";

// types
import type { Language } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface LanguagesState {
  languages: Language[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LanguagesState = {
  languages: [],
  isLoading: false,
  error: null,
};

type CreateLanguagePayload = {
  code: string;
  name: string;
  isDefault: boolean;
  isEnabled: boolean;
};

type UpdateLanguagePayload = CreateLanguagePayload & { id: number };

// Async thunk for fetching languages
export const fetchLanguages = createAsyncThunk<
  Language[],
  number | undefined,
  { rejectValue: string }
>("languages/fetchLanguages", async (cashRegisterId, { rejectWithValue }) => {
  try {
    const data = await getLanguages(cashRegisterId);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch languages"),
    );
  }
});

// Async thunk for creating language
export const addLanguage = createAsyncThunk<
  Language,
  CreateLanguagePayload,
  { rejectValue: string }
>("languages/addLanguage", async (payload, { rejectWithValue }) => {
  try {
    const data = await createLanguage(
      payload.code,
      payload.name,
      payload.isDefault,
      payload.isEnabled,
    );
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create language"),
    );
  }
});

// Async thunk for updating language
export const updateLanguageInStore = createAsyncThunk<
  Language,
  UpdateLanguagePayload,
  { rejectValue: string }
>("languages/updateLanguage", async (payload, { rejectWithValue }) => {
  try {
    const data = await updateLanguage(
      payload.id,
      payload.code,
      payload.name,
      payload.isDefault,
      payload.isEnabled,
    );
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update language"),
    );
  }
});

// Async thunk for deleting language
export const removeLanguage = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("languages/removeLanguage", async (id, { rejectWithValue }) => {
  try {
    await deleteLanguage(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete language"),
    );
  }
});

const languagesSlice = createSlice({
  name: "languages",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDefaultFlags: (
      state,
      action: PayloadAction<{ excludeId?: number } | undefined>,
    ) => {
      state.languages = state.languages.map((lang) => ({
        ...lang,
        isDefault: lang.id === action.payload?.excludeId,
      }));
    },
  },
  extraReducers: (builder) => {
    // Fetch languages
    builder
      .addCase(fetchLanguages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchLanguages.fulfilled,
        (state, action: PayloadAction<Language[]>) => {
          state.isLoading = false;
          state.languages = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchLanguages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch languages";
      });

    // Add language
    builder
      .addCase(addLanguage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addLanguage.fulfilled,
        (state, action: PayloadAction<Language>) => {
          state.isLoading = false;
          state.languages.push(action.payload);
          state.error = null;
        },
      )
      .addCase(addLanguage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create language";
      });

    // Update language
    builder
      .addCase(updateLanguageInStore.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateLanguageInStore.fulfilled,
        (state, action: PayloadAction<Language>) => {
          state.isLoading = false;
          const index = state.languages.findIndex(
            (lang) => lang.id === action.payload.id,
          );
          if (index !== -1) {
            state.languages[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(updateLanguageInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update language";
      });

    // Delete language
    builder
      .addCase(removeLanguage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeLanguage.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.languages = state.languages.filter(
            (lang) => lang.id !== action.payload,
          );
          state.error = null;
        },
      )
      .addCase(removeLanguage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete language";
      });
  },
});

export const { clearError, clearDefaultFlags } = languagesSlice.actions;
export default languagesSlice.reducer;
