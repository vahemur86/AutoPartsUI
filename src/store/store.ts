import { configureStore } from "@reduxjs/toolkit";
import exampleReducer from "./slices/exampleSlice";
import warehousesReducer from "./slices/warehousesSlice";
import shopsReducer from "./slices/shopsSlice";

export const store = configureStore({
  reducer: {
    example: exampleReducer,
    warehouses: warehousesReducer,
    shops: shopsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
