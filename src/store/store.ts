import { configureStore } from "@reduxjs/toolkit";
import warehousesReducer from "./slices/warehousesSlice";
import shopsReducer from "./slices/shopsSlice";
import productSettingsReducer from "./slices/productSettingsSlice";
import productsReducer from "./slices/productsSlice";
import tasksReducer from "./slices/tasksSlice";
import vehiclesReducer from "./slices/vehiclesSlice";
import authReducer from "./slices/authSlice";
import metalRatesReducer from "./slices/metalRatesSlice";
import operatorReducer from "./slices/operatorSlice";
import catalystBucketsReducer from "./slices/catalystBucketsSlice";
import exchangeRatesReducer from "./slices/exchangeRatesSlice";
import languagesReducer from "./slices/languagesSlice";
import customerTypesReducer from "./slices/customerTypesSlice";
import cashRegistersReducer from "./slices/cashRegistersSlice";

export const store = configureStore({
  reducer: {
    warehouses: warehousesReducer,
    shops: shopsReducer,
    productSettings: productSettingsReducer,
    products: productsReducer,
    tasks: tasksReducer,
    vehicles: vehiclesReducer,
    metalRates: metalRatesReducer,
    operator: operatorReducer,
    auth: authReducer,
    catalystBuckets: catalystBucketsReducer,
    exchangeRates: exchangeRatesReducer,
    languages: languagesReducer,
    customerTypes: customerTypesReducer,
    cashRegisters: cashRegistersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
