import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/products";
import type { Product } from "@/types.ts/products";

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  isLoading: false,
  error: null,
};

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getProducts();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch products");
    }
  }
);

// Async thunk for creating product
export const addProduct = createAsyncThunk(
  "products/addProduct",
  async (
    {
      code,
      sku,
      brandId,
      categoryId,
      unitTypeId,
      boxSizeId,
      vehicleDependent,
    }: {
      code: string;
      sku: string;
      brandId: number;
      categoryId: number;
      unitTypeId: number;
      boxSizeId: number;
      vehicleDependent: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await createProduct(
        code,
        sku,
        brandId,
        categoryId,
        unitTypeId,
        boxSizeId,
        vehicleDependent
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create product");
    }
  }
);

// Async thunk for updating product
export const updateProductInStore = createAsyncThunk(
  "products/updateProduct",
  async (
    {
      id,
      code,
      sku,
      brandId,
      categoryId,
      unitTypeId,
      boxSizeId,
      vehicleDependent,
    }: {
      id: number;
      code: string;
      sku: string;
      brandId: number;
      categoryId: number;
      unitTypeId: number;
      boxSizeId: number;
      vehicleDependent: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await updateProduct(
        id,
        code,
        sku,
        brandId,
        categoryId,
        unitTypeId,
        boxSizeId,
        vehicleDependent
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update product");
    }
  }
);

// Async thunk for deleting product
export const removeProduct = createAsyncThunk(
  "products/removeProduct",
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteProduct(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete product");
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchProducts.fulfilled,
        (state, action: PayloadAction<Product[]>) => {
          state.isLoading = false;
          state.products = action.payload;
          state.error = null;
        }
      )
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add product
    builder
      .addCase(addProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        addProduct.fulfilled,
        (state, action: PayloadAction<Product>) => {
          state.isLoading = false;
          state.products.push(action.payload);
          state.error = null;
        }
      )
      .addCase(addProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update product
    builder
      .addCase(updateProductInStore.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        updateProductInStore.fulfilled,
        (state, action: PayloadAction<Product>) => {
          state.isLoading = false;
          const index = state.products.findIndex(
            (p) => p.id === action.payload.id
          );
          if (index !== -1) {
            state.products[index] = action.payload;
          }
          state.error = null;
        }
      )
      .addCase(updateProductInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete product
    builder
      .addCase(removeProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeProduct.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.products = state.products.filter(
            (p) => p.id !== action.payload
          );
          state.error = null;
        }
      )
      .addCase(removeProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = productsSlice.actions;
export default productsSlice.reducer;
