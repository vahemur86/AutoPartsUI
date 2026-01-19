import { configureStore } from "@reduxjs/toolkit";
import warehousesReducer from "./slices/warehousesSlice";
import shopsReducer from "./slices/shopsSlice";
import productSettingsReducer from "./slices/productSettingsSlice";
import productsReducer from "./slices/productsSlice";
import tasksReducer from "./slices/tasksSlice";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    warehouses: warehousesReducer,
    shops: shopsReducer,
    productSettings: productSettingsReducer,
    products: productsReducer,
    tasks: tasksReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
