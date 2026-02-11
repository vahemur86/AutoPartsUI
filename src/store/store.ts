import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import warehousesReducer from "./slices/warehousesSlice";
import shopsReducer from "./slices/shopsSlice";
import productSettingsReducer from "./slices/productSettingsSlice";
import productsReducer from "./slices/productsSlice";
import tasksReducer from "./slices/tasksSlice";
import vehiclesReducer from "./slices/vehiclesSlice";
import metalRatesReducer from "./slices/metalRatesSlice";
import operatorReducer from "./slices/operatorSlice";
import catalystBucketsReducer from "./slices/catalystBucketsSlice";
import exchangeRatesReducer from "./slices/exchangeRatesSlice";
import languagesReducer from "./slices/languagesSlice";
import customerTypesReducer from "./slices/customerTypesSlice";
import cashboxSessionsReducer from "./slices/cash/cashboxSessionsSlice";
import cashDashboardReducer from "./slices/cash/dashboardSlice";
import cashRegistersReducer from "./slices/cash/registersSlice";
import cashSessionsReducer from "./slices/cash/sessionsSlice";
import offerOptionsReducer from "./slices/offerOptionsSlice";
import salesLotsReducer from "./slices/warehouses/salesLotsSlice";
import reportsReducer from "./slices/warehouses/reportsSlice";
import powderSalesReducer from "./slices/warehouses/powderSalesSlice";
import warehouseProductsReducer from "./slices/warehouses/productsSlice";
import customersReducer from "./slices/customersSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    warehouses: warehousesReducer,
    shops: shopsReducer,
    productSettings: productSettingsReducer,
    products: productsReducer,
    tasks: tasksReducer,
    vehicles: vehiclesReducer,
    metalRates: metalRatesReducer,
    operator: operatorReducer,
    catalystBuckets: catalystBucketsReducer,
    exchangeRates: exchangeRatesReducer,
    languages: languagesReducer,
    customerTypes: customerTypesReducer,
    cashboxSessions: cashboxSessionsReducer,
    cashDashboard: cashDashboardReducer,
    cashRegisters: cashRegistersReducer,
    cashSessions: cashSessionsReducer,
    offerOptions: offerOptionsReducer,
    salesLots: salesLotsReducer,
    warehousesReports: reportsReducer,
    powderSales: powderSalesReducer,
    warehouseProducts: warehouseProductsReducer,
    customers: customersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
