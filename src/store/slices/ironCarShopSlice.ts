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
  recalculateStep,
  getIronPrices,
  recalculateIron,
  deleteCarModel,
  deleteIronType,
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
  RecalculateStepPayload,
  RecalculatePayload,
  RecalculateResponse,
} from "@/types/ironCarShop";

interface IronCarShopState {
  carModels: CarModel[];
  ironTypes: IronType[];
  ironTypesByCar: IronTypeByCar[];
  ironPrices: IronTypePrice[];
  ironPriceList: IronPrice[];
  ironTotals: {
    weightKgTotal: number;
    totalAmountTotal: number;
  } | null;
  recalculationResult: RecalculateResponse | null; // New state field
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
  recalculationResult: null,
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

export const recalculatePrices = createAsyncThunk<
  RecalculateResponse,
  { payload: RecalculatePayload; cashRegisterId: number },
  { rejectValue: string }
>(
  "ironCarShop/recalculatePrices",
  async ({ payload, cashRegisterId }, { rejectWithValue }) => {
    try {
      return await recalculateIron(payload, cashRegisterId);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Recalculation failed"));
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

export const createRecalculationPrice = createAsyncThunk<
  void,
  { payload: RecalculateStepPayload; cashRegisterId: number },
  { rejectValue: string }
>(
  "ironCarShop/createRecalculationPrice",
  async ({ payload, cashRegisterId }, { rejectWithValue }) => {
    try {
      await recalculateStep(payload, cashRegisterId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to add recalculation price"),
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

export const removeCarModel = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("ironCarShop/removeCarModel", async (id, { rejectWithValue }) => {
  try {
    await deleteCarModel(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete car model"),
    );
  }
});

export const removeIronType = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("ironCarShop/removeIronType", async (id, { rejectWithValue }) => {
  try {
    await deleteIronType(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to delete iron type"),
    );
  }
});

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
      state.recalculationResult = null;
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
        state.ironPrices = action.payload.items;
        state.ironTotals = {
          weightKgTotal: action.payload.weightKgTotal,
          totalAmountTotal: action.payload.totalAmountTotal,
        };
      })
      /** Handle Recalculate Prices Success **/
      .addCase(recalculatePrices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recalculationResult = action.payload;
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
      .addCase(createRecalculationPrice.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchIronPriceList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.ironPriceList = action.payload;
      });
    builder
      .addCase(removeCarModel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeCarModel.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.carModels = state.carModels.filter(
            (ct) => ct.id !== action.payload,
          );
          state.error = null;
        },
      )
      .addCase(removeCarModel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete customer type";
      })
      .addCase(removeIronType.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        removeIronType.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.isLoading = false;
          state.ironTypes = state.ironTypes.filter(
            (ct) => ct.id !== action.payload,
          );
          state.error = null;
        },
      )
      .addCase(removeIronType.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete customer type";
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
