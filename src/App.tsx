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
import { UserManagement } from "@/pages/Users";
import { Customers } from "@/pages/Customers";
import { OperatorPage } from "@/pages/Operator";
import { Reports } from "@/pages/Reports";
import { Products } from "@/pages/Products";

// Settings components
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
import { CashRegisters } from "@/components/settings/CashRegisters";
import { OfferIncreaseOptions } from "@/components/settings/OfferOptions";
import { SalePercentages } from "@/components/settings/SalePercentages";
import { IronManagement } from "@/components/settings/IronManagement";

// Reports components
import { ZReports } from "@/components/reports/ZReports";
import { BatchReports } from "@/components/reports/BatchReports";
import { OpenSessions } from "@/components/reports/OpenSessions";
import { PowderBatches } from "@/components/reports/PowderBatches";
import { CashboxSessionsReports } from "@/components/reports/CashboxSessionsReports";
import { IronProductsReport } from "@/components/reports/IronProductsReport";
import { IronSaleReport } from "@/components/reports/IronSaleReport";

// Warehouses components
import { TotalBatches } from "@/components/warehouses/TotalBatches";
import { BatchesToSale } from "@/components/warehouses/BatchesToSale";
import { SoldBatches } from "@/components/warehouses/SoldBatches";
import { ProfitReport } from "@/components/warehouses/ProfitReport";
import { AddProduct } from "@/components/warehouses/AddProduct";
import { WarehouseProducts } from "@/components/warehouses/WarehouseProducts";
import { TransferToShop } from "@/components/warehouses/TransferToShop";

// Products components
import { GeneralProducts } from "@/components/products/General";
import { IronProducts } from "@/components/products/IronProducts";

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

/**
 * Component to initialize default language on app load
 */
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

          {/* ADMIN & SUPERADMIN SPECIFIC ROUTES */}
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
                <Route path="cash-registers" element={<CashRegisters />} />
                <Route
                  path="offer-increase-options"
                  element={<OfferIncreaseOptions />}
                />
                <Route path="sale-percentages" element={<SalePercentages />} />
                <Route path="iron-management" element={<IronManagement />} />
              </Route>

              <Route path="reports" element={<Reports />}>
                <Route index element={<Navigate to="z-reports" replace />} />
                <Route path="z-reports" element={<ZReports />} />
                <Route path="batch-reports" element={<BatchReports />} />
                <Route path="open-sessions" element={<OpenSessions />} />
                <Route path="powder-batches" element={<PowderBatches />} />
                <Route
                  path="cashbox-sessions-reports"
                  element={<CashboxSessionsReports />}
                />
                <Route
                  path="iron-products-reports"
                  element={<IronProductsReport />}
                />
                <Route path="iron-sale" element={<IronSaleReport />} />
              </Route>

              <Route path="warehouses" element={<Warehouses />}>
                <Route
                  index
                  element={<Navigate to="total-batches" replace />}
                />
                <Route path="total-batches" element={<TotalBatches />} />
                <Route path="batches-to-sale" element={<BatchesToSale />} />
                <Route path="sold-batches" element={<SoldBatches />} />
                <Route path="profit" element={<ProfitReport />} />
                <Route path="add-product" element={<AddProduct />} />
                <Route path="products" element={<WarehouseProducts />} />
                <Route path="transfer-to-shop" element={<TransferToShop />} />
              </Route>

              <Route path="products" element={<Products />}>
                <Route
                  index
                  element={<Navigate to="products-list" replace />}
                />
                <Route path="products-list" element={<GeneralProducts />} />
                <Route path="iron-products" element={<IronProducts />} />
              </Route>

              <Route path="shops" element={<Shops />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="customers" element={<Customers />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <ToastContainer {...toastOptions} />
    </Provider>
  );
};
