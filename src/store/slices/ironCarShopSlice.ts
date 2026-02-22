import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getCarModels,
  getIronTypesByModel,
  getIronTypesByCar,
  getIronTypesPrices,
  bulkPurchaseIron,
  addCarModel,
  addIronType,
  addIronPrice,
  getIronPrices,
} from "@/services/ironCarShop";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type {
  CarModel,
  IronType,
  IronTypeByCar,
  IronTypePrice,
  IronPricesResponse,
  PurchaseIronResponse,
  BulkPurchasePayload,
  IronPrice,
  CarModelPayload,
  AddIronPricePayload,
} from "@/types/ironCarShop";

interface IronCarShopState {
  carModels: CarModel[];
  ironTypes: IronType[];
  ironTypesByCar: IronTypeByCar[];
  ironPrices: IronTypePrice[];
  ironPriceList: IronPrice[];
  // Store the overall totals from the calculation response
  ironTotals: {
    weightKgTotal: number;
    totalAmountTotal: number;
  } | null;
  lastPurchase: PurchaseIronResponse[] | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: IronCarShopState = {
  carModels: [],
  ironTypes: [],
  ironTypesByCar: [],
  ironPrices: [],
  ironPriceList: [],
  ironTotals: null,
  lastPurchase: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
};

export const fetchCarModels = createAsyncThunk<
  CarModel[],
  { cashRegisterId: number; lang: string },
  { rejectValue: string }
>(
  "ironCarShop/fetchCarModels",
  async ({ cashRegisterId, lang }, { rejectWithValue }) => {
    try {
      return await getCarModels(cashRegisterId, lang);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Error loading car models"),
      );
    }
  },
);

export const fetchIronTypes = createAsyncThunk<
  IronType[],
  { carModelId: number; cashRegisterId: number; lang: string },
  { rejectValue: string }
>(
  "ironCarShop/fetchIronTypes",
  async ({ carModelId, cashRegisterId, lang }, { rejectWithValue }) => {
    try {
      return await getIronTypesByModel(carModelId, cashRegisterId, lang);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Error loading iron types"),
      );
    }
  },
);

export const fetchIronTypesByCar = createAsyncThunk<
  IronTypeByCar[],
  { carModelId: number; cashRegisterId: number; lang: string },
  { rejectValue: string }
>(
  "ironCarShop/fetchIronTypesByCar",
  async ({ carModelId, cashRegisterId, lang }, { rejectWithValue }) => {
    try {
      return await getIronTypesByCar(carModelId, cashRegisterId, lang);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Error loading iron types by car"),
      );
    }
  },
);

export const calculateIronPrices = createAsyncThunk<
  IronPricesResponse,
  { params: Parameters<typeof getIronTypesPrices>[0]; cashRegisterId: number },
  { rejectValue: string }
>(
  "ironCarShop/calculatePrices",
  async ({ params, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await getIronTypesPrices(params, cashRegisterId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Price calculation failed"),
      );
    }
  },
);

export const submitBulkPurchase = createAsyncThunk<
  PurchaseIronResponse[],
  { payload: BulkPurchasePayload; cashRegisterId: number; lang: string },
  { rejectValue: string }
>(
  "ironCarShop/submitBulkPurchase",
  async ({ payload, cashRegisterId, lang }, { rejectWithValue }) => {
    try {
      return await bulkPurchaseIron(payload, cashRegisterId, lang);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Bulk purchase failed"));
    }
  },
);

export const createCarModel = createAsyncThunk<
  CarModel,
  { payload: CarModelPayload; cashRegisterId: number; lang: string },
  { rejectValue: string }
>(
  "ironCarShop/createCarModel",
  async ({ payload, cashRegisterId, lang }, { rejectWithValue }) => {
    try {
      return await addCarModel(payload, cashRegisterId, lang);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create car model"),
      );
    }
  },
);

export const createIronType = createAsyncThunk<
  IronType,
  {
    carModelId: number;
    payload: CarModelPayload;
    cashRegisterId: number;
    lang: string;
  },
  { rejectValue: string }
>(
  "ironCarShop/createIronType",
  async (
    { carModelId, payload, cashRegisterId, lang },
    { rejectWithValue },
  ) => {
    try {
      return await addIronType(carModelId, payload, cashRegisterId, lang);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create iron type"),
      );
    }
  },
);

export const createIronPrice = createAsyncThunk<
  void,
  {
    ironTypeId: number;
    payload: AddIronPricePayload;
    cashRegisterId: number;
    lang: string;
  },
  { rejectValue: string }
>(
  "ironCarShop/createIronPrice",
  async (
    { ironTypeId, payload, cashRegisterId, lang },
    { rejectWithValue },
  ) => {
    try {
      await addIronPrice(ironTypeId, payload, cashRegisterId, lang);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create iron price"),
      );
    }
  },
);

export const fetchIronPriceList = createAsyncThunk<
  IronPrice[],
  {
    ironTypeId: number;
    cashRegisterId: number;
    lang: string;
    carModelId?: number;
    customerTypeId?: number;
  },
  { rejectValue: string }
>(
  "ironCarShop/fetchIronPriceList",
  async (
    { ironTypeId, cashRegisterId, lang, carModelId, customerTypeId },
    { rejectWithValue },
  ) => {
    try {
      return await getIronPrices(
        ironTypeId,
        cashRegisterId,
        lang,
        carModelId,
        customerTypeId,
      );
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to fetch iron price list"),
      );
    }
  },
);

const ironCarShopSlice = createSlice({
  name: "ironCarShop",
  initialState,
  reducers: {
    clearShopError: (state) => {
      state.error = null;
    },
    resetShopState: () => initialState,
    clearPrices: (state) => {
      state.ironPrices = [];
      state.ironTotals = null;
      state.ironTypes = [];
    },
    clearIronPriceList: (state) => {
      state.ironPriceList = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCarModels.fulfilled, (state, action) => {
        state.isLoading = false;
        state.carModels = action.payload;
      })
      .addCase(fetchIronTypes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ironTypes = action.payload;
      })
      .addCase(fetchIronTypesByCar.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ironTypesByCar = action.payload;
      })
      .addCase(calculateIronPrices.fulfilled, (state, action) => {
        state.isLoading = false;
        // Map the items array to ironPrices
        state.ironPrices = action.payload.items;
        // Map the totals to the new state property
        state.ironTotals = {
          weightKgTotal: action.payload.weightKgTotal,
          totalAmountTotal: action.payload.totalAmountTotal,
        };
      })
      .addCase(submitBulkPurchase.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.lastPurchase = action.payload;
      })
      .addCase(createCarModel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.carModels.push(action.payload);
      })
      .addCase(createIronType.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ironTypes.push(action.payload);
      })
      .addCase(createIronPrice.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchIronPriceList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ironPriceList = action.payload;
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("ironCarShop/") &&
          action.type.endsWith("/pending"),
        (state, action) => {
          if (action.type.includes("submit")) {
            state.isSubmitting = true;
          } else {
            state.isLoading = true;
          }
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("ironCarShop/") &&
          action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.isLoading = false;
          state.isSubmitting = false;
          state.error = action.payload ?? "An error occurred";
        },
      );
  },
});

export const {
  clearShopError,
  resetShopState,
  clearPrices,
  clearIronPriceList,
} = ironCarShopSlice.actions;
export default ironCarShopSlice.reducer;
