import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
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

// types
import type { ProductSettingItem } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface ProductSettingsState {
  brands: ProductSettingItem[];
  categories: ProductSettingItem[];
  unitTypes: ProductSettingItem[];
  boxSizes: ProductSettingItem[];
  isLoading: boolean;
  error: string | null;
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
export const fetchBrands = createAsyncThunk<
  ProductSettingItem[],
  void,
  { rejectValue: string }
>("productSettings/fetchBrands", async (_, { rejectWithValue }) => {
  try {
    const data = await getBrands();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch brands"));
  }
});

export const addBrand = createAsyncThunk<
  ProductSettingItem,
  string,
  { rejectValue: string }
>("productSettings/addBrand", async (code, { rejectWithValue }) => {
  try {
    const data = await createBrands(code);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to create brand"));
  }
});

export const updateBrandInStore = createAsyncThunk<
  { originalId: number; data: ProductSettingItem },
  { id: number; code: string },
  { rejectValue: string }
>("productSettings/updateBrand", async ({ id, code }, { rejectWithValue }) => {
  try {
    const data = await updateBrands(id, code);
    return { originalId: id, data };
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to update brand"));
  }
});

export const removeBrand = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("productSettings/removeBrand", async (id, { rejectWithValue }) => {
  try {
    await deleteBrands(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to delete brand"));
  }
});

// Async thunks for Categories
export const fetchCategories = createAsyncThunk<
  ProductSettingItem[],
  void,
  { rejectValue: string }
>("productSettings/fetchCategories", async (_, { rejectWithValue }) => {
  try {
    const data = await getCategories();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch categories"),
    );
  }
});

export const addCategory = createAsyncThunk<
  ProductSettingItem,
  string,
  { rejectValue: string }
>("productSettings/addCategory", async (code, { rejectWithValue }) => {
  try {
    const data = await createCategory(code);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create category"),
    );
  }
});

export const updateCategoryInStore = createAsyncThunk<
  { originalId: number; data: ProductSettingItem },
  { id: number; code: string },
  { rejectValue: string }
>(
  "productSettings/updateCategory",
  async ({ id, code }, { rejectWithValue }) => {
    try {
      const data = await updateCategory(id, code);
      return { originalId: id, data };
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update category"),
      );
    }
  },
);

export const removeCategory = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("productSettings/removeCategory", async (id, { rejectWithValue }) => {
  try {
    await deleteCategory(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete category"),
    );
  }
});

// Async thunks for UnitTypes
export const fetchUnitTypes = createAsyncThunk<
  ProductSettingItem[],
  void,
  { rejectValue: string }
>("productSettings/fetchUnitTypes", async (_, { rejectWithValue }) => {
  try {
    const data = await getUnitTypes();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch unit types"),
    );
  }
});

export const addUnitType = createAsyncThunk<
  ProductSettingItem,
  string,
  { rejectValue: string }
>("productSettings/addUnitType", async (code, { rejectWithValue }) => {
  try {
    const data = await createUnitType(code);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create unit type"),
    );
  }
});

export const updateUnitTypeInStore = createAsyncThunk<
  { originalId: number; data: ProductSettingItem },
  { id: number; code: string },
  { rejectValue: string }
>(
  "productSettings/updateUnitType",
  async ({ id, code }, { rejectWithValue }) => {
    try {
      const data = await updateUnitType(id, code);
      return { originalId: id, data };
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update unit type"),
      );
    }
  },
);

export const removeUnitType = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("productSettings/removeUnitType", async (id, { rejectWithValue }) => {
  try {
    await deleteUnitType(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete unit type"),
    );
  }
});

// Async thunks for BoxSizes
export const fetchBoxSizes = createAsyncThunk<
  ProductSettingItem[],
  void,
  { rejectValue: string }
>("productSettings/fetchBoxSizes", async (_, { rejectWithValue }) => {
  try {
    const data = await getBoxSizes();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch box sizes"),
    );
  }
});

export const addBoxSize = createAsyncThunk<
  ProductSettingItem,
  string,
  { rejectValue: string }
>("productSettings/addBoxSize", async (code, { rejectWithValue }) => {
  try {
    const data = await createBoxSize(code);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create box size"),
    );
  }
});

export const updateBoxSizeInStore = createAsyncThunk<
  { originalId: number; data: ProductSettingItem },
  { id: number; code: string },
  { rejectValue: string }
>(
  "productSettings/updateBoxSize",
  async ({ id, code }, { rejectWithValue }) => {
    try {
      const data = await updateBoxSize(id, code);
      return { originalId: id, data };
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update box size"),
      );
    }
  },
);

export const removeBoxSize = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("productSettings/removeBoxSize", async (id, { rejectWithValue }) => {
  try {
    await deleteBoxSize(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete box size"),
    );
  }
});

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
        },
      )
      .addCase(fetchBrands.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch brands";
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
        },
      )
      .addCase(addBrand.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create brand";
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
          }>,
        ) => {
          state.isLoading = false;
          const responseId = action.payload.data.id;
          const originalId = action.payload.originalId;

          if (responseId !== originalId) {
            state.brands = state.brands.filter((b) => b.id !== originalId);
            const exists = state.brands.some((b) => b.id === responseId);
            if (!exists) state.brands.push(action.payload.data);
          } else {
            const index = state.brands.findIndex((b) => b.id === originalId);
            if (index !== -1) {
              state.brands[index] = action.payload.data;
            } else {
              console.warn(
                `Brand with id ${originalId} not found for update. Will refetch.`,
              );
              state.fetchedData.brands = false;
            }
          }
          state.error = null;
        },
      )
      .addCase(updateBrandInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update brand";
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
        },
      )
      .addCase(removeBrand.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete brand";
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
        },
      )
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch categories";
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
        },
      )
      .addCase(addCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create category";
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
          }>,
        ) => {
          state.isLoading = false;
          const responseId = action.payload.data.id;
          const originalId = action.payload.originalId;

          if (responseId !== originalId) {
            state.categories = state.categories.filter(
              (c) => c.id !== originalId,
            );
            const exists = state.categories.some((c) => c.id === responseId);
            if (!exists) state.categories.push(action.payload.data);
          } else {
            const index = state.categories.findIndex(
              (c) => c.id === originalId,
            );
            if (index !== -1) {
              state.categories[index] = action.payload.data;
            } else {
              console.warn(
                `Category with id ${originalId} not found for update. Will refetch.`,
              );
              state.fetchedData.categories = false;
            }
          }
          state.error = null;
        },
      )
      .addCase(updateCategoryInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update category";
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
            (c) => c.id !== action.payload,
          );
          state.error = null;
        },
      )
      .addCase(removeCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete category";
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
        },
      )
      .addCase(fetchUnitTypes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch unit types";
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
        },
      )
      .addCase(addUnitType.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create unit type";
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
          }>,
        ) => {
          state.isLoading = false;
          const responseId = action.payload.data.id;
          const originalId = action.payload.originalId;

          if (responseId !== originalId) {
            state.unitTypes = state.unitTypes.filter(
              (u) => u.id !== originalId,
            );
            const exists = state.unitTypes.some((u) => u.id === responseId);
            if (!exists) state.unitTypes.push(action.payload.data);
          } else {
            const index = state.unitTypes.findIndex((u) => u.id === originalId);
            if (index !== -1) {
              state.unitTypes[index] = action.payload.data;
            } else {
              console.warn(
                `UnitType with id ${originalId} not found for update. Will refetch.`,
              );
              state.fetchedData.unitTypes = false;
            }
          }
          state.error = null;
        },
      )
      .addCase(updateUnitTypeInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update unit type";
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
            (u) => u.id !== action.payload,
          );
          state.error = null;
        },
      )
      .addCase(removeUnitType.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete unit type";
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
        },
      )
      .addCase(fetchBoxSizes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch box sizes";
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
        },
      )
      .addCase(addBoxSize.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create box size";
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
          }>,
        ) => {
          state.isLoading = false;
          const responseId = action.payload.data.id;
          const originalId = action.payload.originalId;

          if (responseId !== originalId) {
            state.boxSizes = state.boxSizes.filter((b) => b.id !== originalId);
            const exists = state.boxSizes.some((b) => b.id === responseId);
            if (!exists) state.boxSizes.push(action.payload.data);
          } else {
            const index = state.boxSizes.findIndex((b) => b.id === originalId);
            if (index !== -1) {
              state.boxSizes[index] = action.payload.data;
            } else {
              console.warn(
                `BoxSize with id ${originalId} not found for update. Will refetch.`,
              );
              state.fetchedData.boxSizes = false;
            }
          }
          state.error = null;
        },
      )
      .addCase(updateBoxSizeInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update box size";
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
            (b) => b.id !== action.payload,
          );
          state.error = null;
        },
      )
      .addCase(removeBoxSize.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete box size";
      });
  },
});

export const { clearError } = productSettingsSlice.actions;
export default productSettingsSlice.reducer;
