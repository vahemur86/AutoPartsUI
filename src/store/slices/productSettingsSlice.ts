import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  getBrands,
  createBrands,
  updateBrands,
  deleteBrands,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getUnitTypes,
  createUnitType,
  updateUnitType,
  deleteUnitType,
  getBoxSizes,
  createBoxSize,
  updateBoxSize,
  deleteBoxSize,
} from "@/services/settings/productSettings";
import type { ProductSettingItem } from "@/types/settings";

interface ProductSettingsState {
  brands: ProductSettingItem[];
  categories: ProductSettingItem[];
  unitTypes: ProductSettingItem[];
  boxSizes: ProductSettingItem[];
  isLoading: boolean;
  error: string | null;
  // Track which data has been fetched to prevent duplicate requests
  fetchedData: {
    brands: boolean;
    categories: boolean;
    unitTypes: boolean;
    boxSizes: boolean;
  };
}

const initialState: ProductSettingsState = {
  brands: [],
  categories: [],
  unitTypes: [],
  boxSizes: [],
  isLoading: false,
  error: null,
  fetchedData: {
    brands: false,
    categories: false,
    unitTypes: false,
    boxSizes: false,
  },
};

// Async thunks for Brands
export const fetchBrands = createAsyncThunk(
  "productSettings/fetchBrands",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getBrands();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch brands");
    }
  }
);

export const addBrand = createAsyncThunk(
  "productSettings/addBrand",
  async (code: string, { rejectWithValue }) => {
    try {
      const data = await createBrands(code);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create brand");
    }
  }
);

export const updateBrandInStore = createAsyncThunk(
  "productSettings/updateBrand",
  async ({ id, code }: { id: number; code: string }, { rejectWithValue }) => {
    try {
      const data = await updateBrands(id, code);
      // Return both the original ID and the response data
      // This ensures we can find the item even if API returns different ID
      return { originalId: id, data };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update brand");
    }
  }
);

export const removeBrand = createAsyncThunk(
  "productSettings/removeBrand",
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteBrands(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete brand");
    }
  }
);

// Async thunks for Categories
export const fetchCategories = createAsyncThunk(
  "productSettings/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getCategories();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch categories");
    }
  }
);

export const addCategory = createAsyncThunk(
  "productSettings/addCategory",
  async (code: string, { rejectWithValue }) => {
    try {
      const data = await createCategory(code);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create category");
    }
  }
);

export const updateCategoryInStore = createAsyncThunk(
  "productSettings/updateCategory",
  async ({ id, code }: { id: number; code: string }, { rejectWithValue }) => {
    try {
      const data = await updateCategory(id, code);
      // Return both the original ID and the response data
      // This ensures we can find the item even if API returns different ID
      return { originalId: id, data };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update category");
    }
  }
);

export const removeCategory = createAsyncThunk(
  "productSettings/removeCategory",
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteCategory(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete category");
    }
  }
);

// Async thunks for UnitTypes
export const fetchUnitTypes = createAsyncThunk(
  "productSettings/fetchUnitTypes",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getUnitTypes();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch unit types");
    }
  }
);

export const addUnitType = createAsyncThunk(
  "productSettings/addUnitType",
  async (code: string, { rejectWithValue }) => {
    try {
      const data = await createUnitType(code);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create unit type");
    }
  }
);

export const updateUnitTypeInStore = createAsyncThunk(
  "productSettings/updateUnitType",
  async ({ id, code }: { id: number; code: string }, { rejectWithValue }) => {
    try {
      const data = await updateUnitType(id, code);
      // Return both the original ID and the response data
      // This ensures we can find the item even if API returns different ID
      return { originalId: id, data };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update unit type");
    }
  }
);

export const removeUnitType = createAsyncThunk(
  "productSettings/removeUnitType",
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteUnitType(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete unit type");
    }
  }
);

// Async thunks for BoxSizes
export const fetchBoxSizes = createAsyncThunk(
  "productSettings/fetchBoxSizes",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getBoxSizes();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch box sizes");
    }
  }
);

export const addBoxSize = createAsyncThunk(
  "productSettings/addBoxSize",
  async (code: string, { rejectWithValue }) => {
    try {
      const data = await createBoxSize(code);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create box size");
    }
  }
);

export const updateBoxSizeInStore = createAsyncThunk(
  "productSettings/updateBoxSize",
  async ({ id, code }: { id: number; code: string }, { rejectWithValue }) => {
    try {
      const data = await updateBoxSize(id, code);
      // Return both the original ID and the response data
      // This ensures we can find the item even if API returns different ID
      return { originalId: id, data };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update box size");
    }
  }
);

export const removeBoxSize = createAsyncThunk(
  "productSettings/removeBoxSize",
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteBoxSize(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete box size");
    }
  }
);

const productSettingsSlice = createSlice({
  name: "productSettings",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Brands
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchBrands.fulfilled,
        (state, action: PayloadAction<ProductSettingItem[]>) => {
          state.isLoading = false;
          state.brands = action.payload;
          state.fetchedData.brands = true;
          state.error = null;
        }
      )
      .addCase(fetchBrands.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addBrand.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addBrand.fulfilled,
        (state, action: PayloadAction<ProductSettingItem>) => {
          state.isLoading = false;
          state.brands.push(action.payload);
          state.error = null;
        }
      )
      .addCase(addBrand.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateBrandInStore.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateBrandInStore.fulfilled,
        (
          state,
          action: PayloadAction<{
            originalId: number;
            data: ProductSettingItem;
          }>
        ) => {
          state.isLoading = false;
          const responseId = action.payload.data.id;
          const originalId = action.payload.originalId;

          // Check if backend returned a different ID (new item created instead of updated)
          if (responseId !== originalId) {
            // Backend created a new item - remove the old one and add the new one
            state.brands = state.brands.filter((b) => b.id !== originalId);
            // Check if new item already exists to prevent duplicates
            const exists = state.brands.some((b) => b.id === responseId);
            if (!exists) {
              state.brands.push(action.payload.data);
            }
          } else {
            // Normal update - find and update the existing item
            const index = state.brands.findIndex((b) => b.id === originalId);
            if (index !== -1) {
              // Replace the entire item with the response data
              state.brands[index] = action.payload.data;
            } else {
              // Item not found - mark for refetch
              console.warn(
                `Brand with id ${originalId} not found for update. Will refetch.`
              );
              state.fetchedData.brands = false;
            }
          }
          state.error = null;
        }
      )
      .addCase(updateBrandInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(removeBrand.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeBrand.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.brands = state.brands.filter((b) => b.id !== action.payload);
          state.error = null;
        }
      )
      .addCase(removeBrand.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCategories.fulfilled,
        (state, action: PayloadAction<ProductSettingItem[]>) => {
          state.isLoading = false;
          state.categories = action.payload;
          state.fetchedData.categories = true;
          state.error = null;
        }
      )
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addCategory.fulfilled,
        (state, action: PayloadAction<ProductSettingItem>) => {
          state.isLoading = false;
          state.categories.push(action.payload);
          state.error = null;
        }
      )
      .addCase(addCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateCategoryInStore.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateCategoryInStore.fulfilled,
        (
          state,
          action: PayloadAction<{
            originalId: number;
            data: ProductSettingItem;
          }>
        ) => {
          state.isLoading = false;
          const responseId = action.payload.data.id;
          const originalId = action.payload.originalId;

          // Check if backend returned a different ID (new item created instead of updated)
          if (responseId !== originalId) {
            // Backend created a new item - remove the old one and add the new one
            state.categories = state.categories.filter(
              (c) => c.id !== originalId
            );
            // Check if new item already exists to prevent duplicates
            const exists = state.categories.some((c) => c.id === responseId);
            if (!exists) {
              state.categories.push(action.payload.data);
            }
          } else {
            // Normal update - find and update the existing item
            const index = state.categories.findIndex(
              (c) => c.id === originalId
            );
            if (index !== -1) {
              // Replace the entire item with the response data
              state.categories[index] = action.payload.data;
            } else {
              // Item not found - mark for refetch
              console.warn(
                `Category with id ${originalId} not found for update. Will refetch.`
              );
              state.fetchedData.categories = false;
            }
          }
          state.error = null;
        }
      )
      .addCase(updateCategoryInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(removeCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeCategory.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.categories = state.categories.filter(
            (c) => c.id !== action.payload
          );
          state.error = null;
        }
      )
      .addCase(removeCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // UnitTypes
    builder
      .addCase(fetchUnitTypes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchUnitTypes.fulfilled,
        (state, action: PayloadAction<ProductSettingItem[]>) => {
          state.isLoading = false;
          state.unitTypes = action.payload;
          state.fetchedData.unitTypes = true;
          state.error = null;
        }
      )
      .addCase(fetchUnitTypes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addUnitType.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addUnitType.fulfilled,
        (state, action: PayloadAction<ProductSettingItem>) => {
          state.isLoading = false;
          state.unitTypes.push(action.payload);
          state.error = null;
        }
      )
      .addCase(addUnitType.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUnitTypeInStore.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateUnitTypeInStore.fulfilled,
        (
          state,
          action: PayloadAction<{
            originalId: number;
            data: ProductSettingItem;
          }>
        ) => {
          state.isLoading = false;
          const responseId = action.payload.data.id;
          const originalId = action.payload.originalId;

          // Check if backend returned a different ID (new item created instead of updated)
          if (responseId !== originalId) {
            // Backend created a new item - remove the old one and add the new one
            state.unitTypes = state.unitTypes.filter(
              (u) => u.id !== originalId
            );
            // Check if new item already exists to prevent duplicates
            const exists = state.unitTypes.some((u) => u.id === responseId);
            if (!exists) {
              state.unitTypes.push(action.payload.data);
            }
          } else {
            // Normal update - find and update the existing item
            const index = state.unitTypes.findIndex((u) => u.id === originalId);
            if (index !== -1) {
              // Replace the entire item with the response data
              state.unitTypes[index] = action.payload.data;
            } else {
              // Item not found - mark for refetch
              console.warn(
                `UnitType with id ${originalId} not found for update. Will refetch.`
              );
              state.fetchedData.unitTypes = false;
            }
          }
          state.error = null;
        }
      )
      .addCase(updateUnitTypeInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(removeUnitType.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeUnitType.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.unitTypes = state.unitTypes.filter(
            (u) => u.id !== action.payload
          );
          state.error = null;
        }
      )
      .addCase(removeUnitType.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // BoxSizes
    builder
      .addCase(fetchBoxSizes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchBoxSizes.fulfilled,
        (state, action: PayloadAction<ProductSettingItem[]>) => {
          state.isLoading = false;
          state.boxSizes = action.payload;
          state.fetchedData.boxSizes = true;
          state.error = null;
        }
      )
      .addCase(fetchBoxSizes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addBoxSize.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addBoxSize.fulfilled,
        (state, action: PayloadAction<ProductSettingItem>) => {
          state.isLoading = false;
          state.boxSizes.push(action.payload);
          state.error = null;
        }
      )
      .addCase(addBoxSize.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateBoxSizeInStore.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateBoxSizeInStore.fulfilled,
        (
          state,
          action: PayloadAction<{
            originalId: number;
            data: ProductSettingItem;
          }>
        ) => {
          state.isLoading = false;
          const responseId = action.payload.data.id;
          const originalId = action.payload.originalId;

          // Check if backend returned a different ID (new item created instead of updated)
          if (responseId !== originalId) {
            // Backend created a new item - remove the old one and add the new one
            state.boxSizes = state.boxSizes.filter((b) => b.id !== originalId);
            // Check if new item already exists to prevent duplicates
            const exists = state.boxSizes.some((b) => b.id === responseId);
            if (!exists) {
              state.boxSizes.push(action.payload.data);
            }
          } else {
            // Normal update - find and update the existing item
            const index = state.boxSizes.findIndex((b) => b.id === originalId);
            if (index !== -1) {
              // Replace the entire item with the response data
              state.boxSizes[index] = action.payload.data;
            } else {
              // Item not found - mark for refetch
              console.warn(
                `BoxSize with id ${originalId} not found for update. Will refetch.`
              );
              state.fetchedData.boxSizes = false;
            }
          }
          state.error = null;
        }
      )
      .addCase(updateBoxSizeInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(removeBoxSize.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeBoxSize.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.boxSizes = state.boxSizes.filter(
            (b) => b.id !== action.payload
          );
          state.error = null;
        }
      )
      .addCase(removeBoxSize.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = productSettingsSlice.actions;
export default productSettingsSlice.reducer;
