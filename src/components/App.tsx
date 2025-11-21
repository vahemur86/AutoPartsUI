import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { store } from "@/store/store";
import { Home } from "./pages/Home/index";
import { Settings } from "./pages/Settings/index";
import { Warehouses } from "./pages/Warehouses/index";
import { Shops } from "./pages/Shops/index";
import ProjectLanguages from "@/components/settings/ProjectLanguages";
import Translation from "@/components/settings/Translation";
import WarehouseSettings from "@/components/settings/WarehouseSettings";
import ShopsSettings from "@/components/settings/ShopsSettings";
import ProductSettings from "@/components/settings/ProductSettings";
import VehicleManagement from "@/components/settings/VehicleManagement";
import "@/index.css";

function App() {
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
            <Route path="shops" element={<Shops />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
