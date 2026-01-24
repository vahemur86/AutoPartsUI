import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Protection Wrapper
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Hooks
import { useDefaultLanguage } from "@/hooks/useDefaultLanguage";

// Pages
import { Home } from "@/pages/Home/index";
import { Settings } from "@/pages/Settings/index";
import { Warehouses } from "@/pages/Warehouses/index";
import { Shops } from "@/pages/Shops/index";
import { Login } from "@/pages/Login/index";
import { Products } from "@/pages/Products";
import { UserManagement } from "@/pages/Users";
import { OperatorPage } from "@/pages/Operator";

// Components
import { ProjectLanguages } from "@/components/settings/ProjectLanguages";
import { Translation } from "@/components/settings/Translation";
import { WarehouseSettings } from "@/components/settings/WarehouseSettings";
import { ShopsSettings } from "@/components/settings/ShopsSettings";
import { ProductSettings } from "@/components/settings/ProductSettings";
import { VehicleManagement } from "@/components/settings/VehicleManagement";
import { MetalRates } from "@/components/settings/MetalRates";
import { CatalystBuckets } from "@/components/settings/CatalystBuckets";
import { CustomerTypes } from "@/components/settings/CustomerTypes";
import { ExchangeRates } from "@/components/settings/ExchangeRates";

// Stores
import { store } from "@/store/store";

// Styles
import "@/index.css";

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

// Component to initialize default language on app load
const LanguageInitializer = () => {
  useDefaultLanguage();
  return null;
};

export const App = () => {
  return (
    <Provider store={store}>
      <LanguageInitializer />
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTE */}
          <Route path="/login" element={<Login />} />

          {/* OPERATOR SPECIFIC ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={["Operator"]} />}>
            <Route path="/operator" element={<OperatorPage />} />
          </Route>

          {/* ADMIN SPECIFIC ROUTES */}
          <Route
            element={<ProtectedRoute allowedRoles={["Admin", "SuperAdmin"]} />}
          >
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
                <Route
                  path="project-languages"
                  element={<ProjectLanguages />}
                />
                <Route path="translation" element={<Translation />} />
                <Route path="warehouse" element={<WarehouseSettings />} />
                <Route path="shops" element={<ShopsSettings />} />
                <Route path="product-settings" element={<ProductSettings />} />
                <Route
                  path="vehicle-management"
                  element={<VehicleManagement />}
                />
                <Route path="metal-rates" element={<MetalRates />} />
                <Route path="catalyst-buckets" element={<CatalystBuckets />} />
                <Route path="exchange-rates" element={<ExchangeRates />} />
                <Route path="customer-types" element={<CustomerTypes />} />
              </Route>

              <Route path="warehouses" element={<Warehouses />} />
              <Route path="products" element={<Products />} />
              <Route path="shops" element={<Shops />} />
              <Route path="users" element={<UserManagement />} />
            </Route>
          </Route>

          {/* CATCH-ALL */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <ToastContainer {...toastOptions} />
    </Provider>
  );
};
