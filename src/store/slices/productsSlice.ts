import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/products";

// types
import type { Product } from "@/types/products";

// utils
import { getApiErrorMessage } from "@/utils";

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

type ProductPayload = {
  code: string;
  sku: string;
  brandId: number;
  categoryId: number;
  unitTypeId: number;
  boxSizeId: number;
  vehicleDependent: boolean;
};

type ProductUpdatePayload = ProductPayload & { id: number };

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk<
  Product[],
  void,
  { rejectValue: string }
>("products/fetchProducts", async (_, { rejectWithValue }) => {
  try {
    const data = await getProducts();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch products"),
    );
  }
});

// Async thunk for creating product
export const addProduct = createAsyncThunk<
  Product,
  ProductPayload,
  { rejectValue: string }
>("products/addProduct", async (payload, { rejectWithValue }) => {
  try {
    const data = await createProduct(
      payload.code,
      payload.sku,
      payload.brandId,
      payload.categoryId,
      payload.unitTypeId,
      payload.boxSizeId,
      payload.vehicleDependent,
    );
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to create product"),
    );
  }
});

// Async thunk for updating product
export const updateProductInStore = createAsyncThunk<
  Product,
  ProductUpdatePayload,
  { rejectValue: string }
>("products/updateProduct", async (payload, { rejectWithValue }) => {
  try {
    const data = await updateProduct(
      payload.id,
      payload.code,
      payload.sku,
      payload.brandId,
      payload.categoryId,
      payload.unitTypeId,
      payload.boxSizeId,
      payload.vehicleDependent,
    );
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update product"),
    );
  }
});

// Async thunk for deleting product
export const removeProduct = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("products/removeProduct", async (id, { rejectWithValue }) => {
  try {
    await deleteProduct(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete product"),
    );
  }
});

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
        },
      )
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch products";
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
        },
      )
      .addCase(addProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create product";
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
            (p) => p.id === action.payload.id,
          );
          if (index !== -1) {
            state.products[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(updateProductInStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update product";
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
            (p) => p.id !== action.payload,
          );
          state.error = null;
        },
      )
      .addCase(removeProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete product";
      });
  },
});

export const { clearError } = productsSlice.actions;
export default productsSlice.reducer;
