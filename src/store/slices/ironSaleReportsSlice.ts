import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import { getIronSales, type GetIronSalesParams } from "@/services/ironCarShop";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { PurchaseIronResponse } from "@/types/ironCarShop";

interface IronSaleReportsState {
  sales: PurchaseIronResponse[];
  isLoading: boolean;
  error: string | null;
}

const initialState: IronSaleReportsState = {
  sales: [],
  isLoading: false,
  error: null,
};

export const fetchIronSales = createAsyncThunk<
  PurchaseIronResponse[],
  { params: GetIronSalesParams; cashRegisterId: number },
  { rejectValue: string }
>(
  "ironSaleReports/fetchSales",
  async ({ params, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await getIronSales(params, cashRegisterId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch iron sales"),
      );
    }
  },
);

const ironSaleReportsSlice = createSlice({
  name: "ironSaleReports",
  initialState,
  reducers: {
    resetIronSaleReportsState: (state) => {
      state.sales = [];
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIronSales.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchIronSales.fulfilled,
        (state, action: PayloadAction<PurchaseIronResponse[]>) => {
          state.isLoading = false;
          state.sales = action.payload;
          state.error = null;
        },
      )
      .addCase(
        fetchIronSales.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.error = action.payload || "Failed to fetch iron sales";
        },
      );
  },
});

export const { resetIronSaleReportsState } = ironSaleReportsSlice.actions;
export default ironSaleReportsSlice.reducer;
