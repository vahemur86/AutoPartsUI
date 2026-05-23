import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  createTag,
  deleteTag,
  getTags,
  updateTag,
} from "@/services/settings/tags";

// types
import type { Tag } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface TagsState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TagsState = {
  tags: [],
  isLoading: false,
  error: null,
};

export const fetchTags = createAsyncThunk<
  Tag[],
  void,
  { rejectValue: string }
>("tags/fetchTags", async (_, { rejectWithValue }) => {
  try {
    const data = await getTags();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch tags"));
  }
});

export const addTag = createAsyncThunk<
  Tag,
  Omit<Tag, "id">,
  { rejectValue: string }
>("tags/addTag", async (payload, { rejectWithValue }) => {
  try {
    const data = await createTag(payload);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to create tag"));
  }
});

export const editTag = createAsyncThunk<
  Tag,
  Tag,
  { rejectValue: string }
>("tags/editTag", async (payload, { rejectWithValue }) => {
  try {
    const data = await updateTag(payload);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to update tag"));
  }
});

export const removeTag = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("tags/removeTag", async (id, { rejectWithValue }) => {
  try {
    await deleteTag(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to delete tag"));
  }
});

const tagsSlice = createSlice({
  name: "tags",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTags.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTags.fulfilled, (state, action: PayloadAction<Tag[]>) => {
        state.isLoading = false;
        state.tags = action.payload;
        state.error = null;
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch tags";
      })
      .addCase(addTag.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addTag.fulfilled, (state, action: PayloadAction<Tag>) => {
        state.isLoading = false;
        state.tags.push(action.payload);
        state.error = null;
      })
      .addCase(addTag.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create tag";
      })
      .addCase(editTag.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editTag.fulfilled, (state, action: PayloadAction<Tag>) => {
        state.isLoading = false;
        const index = state.tags.findIndex((tag) => tag.id === action.payload.id);
        if (index !== -1) {
          state.tags[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(editTag.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update tag";
      })
      .addCase(removeTag.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeTag.fulfilled, (state, action: PayloadAction<number>) => {
        state.isLoading = false;
        state.tags = state.tags.filter((tag) => tag.id !== action.payload);
        state.error = null;
      })
      .addCase(removeTag.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete tag";
      });
  },
});

export const { clearError } = tagsSlice.actions;
export default tagsSlice.reducer;
