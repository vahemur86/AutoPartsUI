import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages
import { Home } from "./pages/Home/index";
import { Settings } from "./pages/Settings/index";
import { Warehouses } from "./pages/Warehouses/index";
import { Shops } from "./pages/Shops/index";
import { Login } from "./pages/Login/index";
import { Products } from "./pages/Products";
import { UserManagement } from "./pages/Users";
// Components
import ProjectLanguages from "@/components/settings/ProjectLanguages";
import Translation from "@/components/settings/Translation";
import WarehouseSettings from "@/components/settings/WarehouseSettings";
import ShopsSettings from "@/components/settings/ShopsSettings";
import ProductSettings from "@/components/settings/ProductSettings";
import VehicleManagement from "@/components/settings/VehicleManagement";

import { store } from "@/store/store";
import "@/index.css";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
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
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </Provider>
  );
}

export default App;
