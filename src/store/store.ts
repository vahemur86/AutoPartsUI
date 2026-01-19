import { configureStore } from "@reduxjs/toolkit";
import exampleReducer from "./slices/exampleSlice";
import warehousesReducer from "./slices/warehousesSlice";
import shopsReducer from "./slices/shopsSlice";
import productSettingsReducer from "./slices/productSettingsSlice";
import productsReducer from "./slices/productsSlice";
import tasksReducer from "./slices/tasksSlice";

export const store = configureStore({
  reducer: {
    example: exampleReducer,
    warehouses: warehousesReducer,
    shops: shopsReducer,
    productSettings: productSettingsReducer,
    products: productsReducer,
    tasks: tasksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
