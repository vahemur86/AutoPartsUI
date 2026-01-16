import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { store } from "@/store/store";
import "@/index.css";

import { Home } from "./pages/Home";
import { Settings } from "./pages/Settings";
import { Warehouses } from "./pages/Warehouses";
import { Shops } from "./pages/Shops";
import { Products } from "./pages/Products";

import { ProjectLanguages } from "@/components/settings/ProjectLanguages";
import { Translation } from "@/components/settings/Translation";
import { WarehouseSettings } from "@/components/settings/WarehouseSettings";
import { ShopsSettings } from "@/components/settings/ShopsSettings";
import { ProductSettings } from "@/components/settings/ProductSettings";
import { VehicleManagement } from "@/components/settings/VehicleManagement";

const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
  theme: "dark",
} as const;

export const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route
              index
              element={<Navigate to="/settings/product-settings" replace />}
            />

            <Route path="settings" element={<Settings />}>
              <Route
                index
                element={<Navigate to="product-settings" replace />}
              />
              <Route path="project-languages" element={<ProjectLanguages />} />
              <Route path="translation" element={<Translation />} />
              <Route path="warehouse" element={<WarehouseSettings />} />
              <Route path="shops" element={<ShopsSettings />} />
              <Route path="product-settings" element={<ProductSettings />} />
              <Route
                path="vehicle-management"
                element={<VehicleManagement />}
              />
            </Route>

            <Route path="warehouses" element={<Warehouses />} />
            <Route path="products" element={<Products />} />
            <Route path="shops" element={<Shops />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>

      <ToastContainer {...toastOptions} />
    </Provider>
  );
};
