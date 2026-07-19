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
import { ShopOperatorPage } from "@/pages/ShopOperator";
import { ProgrammerPage } from "@/pages/Programmer";
import { Reports } from "@/pages/Reports";
import { FinanceReports } from "@/pages/FinanceReports";
import { Products } from "@/pages/Products";
import { ServiceTemplatePage } from "@/pages/ServiceTemplatePage";

// Settings components
import { ProjectLanguages } from "@/components/settings/ProjectLanguages";
import { PageControl } from "@/components/settings/PageControl";
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
import { ServiceTasks } from "@/components/settings/ServiceTasks";
import { Tags } from "@/components/settings/Tags";
import { ProgrammingPricingAdmin } from "@/components/settings/ProgrammingPricingAdmin";

// Reports components
import { ZReports } from "@/components/reports/ZReports";
import { BatchReports } from "@/components/reports/BatchReports";
import { OpenSessions } from "@/components/reports/OpenSessions";
import { PowderBatches } from "@/components/reports/PowderBatches";
import { CashboxSessionsReports } from "@/components/reports/CashboxSessionsReports";
import { IronProductsReport } from "@/components/reports/IronProductsReport";
import { IronSaleReport } from "@/components/reports/IronSaleReport";
import { WorkshopOrdersReport } from "@/components/reports/WorkshopOrdersReport";
import { ServiceTasksReport } from "@/components/reports/ServiceTasksReport";

// Finance Reports components
import { ProfitSummary } from "@/components/financeReports/ProfitSummary";
import { ProfitDetailed } from "@/components/financeReports/ProfitDetailed";
import { SaleProfitLookup } from "@/components/financeReports/SaleProfitLookup";
import { WarehouseInventoryStatus } from "@/components/financeReports/WarehouseInventoryStatus";
import { ShopInventoryStatus } from "@/components/financeReports/ShopInventoryStatus";
import { ShopReports } from "@/components/financeReports/ShopReports";
import { ServiceReports } from "@/components/financeReports/ServiceReports";
import { WarehouseReports } from "@/components/financeReports/WarehouseReports";
import { SalesReports } from "@/components/financeReports/SalesReports";
import { DashboardReports } from "@/components/financeReports/DashboardReports";
import { OtherExpensesReports } from "@/components/financeReports/OtherExpensesReports";

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
import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { forceLogout } from "@/store/slices/authSlice";
import { useNavigate } from "react-router-dom";

// Styles
import "@/index.css";
import { OtpGateProvider } from "./components/otpGateProvider/OtpGateProvider";
import { CatalystPricings } from "./components/settings/CatalystPricing";
import { AdjustedSales } from "./components/warehouses/AdjustedSales/AdjustedSales";
import { NewCalculator } from "./pages/Calculator";
import { SetPassword } from "./pages/SetPassword/SetPassword";
import { CarCatalystPage } from "./pages/CarCatalyst/CarCatalyst";
import { CarCatalystDetails } from "./pages/CarCatalyst/CarCatalystDetails";

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
  const AuthEventListener = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
      const handler = () => {
        dispatch(forceLogout());
        navigate("/login", { replace: true });
      };

      window.addEventListener("auth:logout", handler);
      return () => window.removeEventListener("auth:logout", handler);
    }, [dispatch, navigate]);

    return null;
  };

  return (
    <Provider store={store}>
      <OtpGateProvider>
        <LanguageInitializer />
        <BrowserRouter>
          <AuthEventListener />
          <Routes>
            {/* PUBLIC ROUTE */}
            <Route path="/login" element={<Login />} />

            <Route path="/set-password" element={<SetPassword />} />

            {/* OPERATOR / CASHIER SPECIFIC ROUTES */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["Operator", "Cashier", "Programmer"]} />
              }
            >
              <Route path="/operator" element={<OperatorPage />} />
              <Route path="/shop-operator" element={<ShopOperatorPage />} />
              <Route path="/programmer" element={<ProgrammerPage />} />
            </Route>

            {/* ADMIN & SUPERADMIN SPECIFIC ROUTES */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["Admin", "SuperAdmin"]} />
              }
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
                  <Route path="page-control" element={<PageControl />} />

                  <Route path="translation" element={<Translation />} />
                  <Route path="warehouse" element={<WarehouseSettings />} />
                  <Route path="shops" element={<ShopsSettings />} />
                  <Route
                    path="product-settings"
                    element={<ProductSettings />}
                  />
                  <Route
                    path="vehicle-management"
                    element={<VehicleManagement />}
                  />
                  <Route path="metal-rates" element={<MetalRates />} />
                  <Route
                    path="catalyst-buckets"
                    element={<CatalystBuckets />}
                  />
                  <Route
                    path="catalyst-pricing"
                    element={<CatalystPricings />}
                  />
                  <Route path="car-catalyst" element={<CarCatalystPage />} />
                  <Route
                    path="car-catalyst/details"
                    element={<CarCatalystDetails />}
                  />
                  <Route path="exchange-rates" element={<ExchangeRates />} />
                  <Route path="customer-types" element={<CustomerTypes />} />
                  <Route path="cash-registers" element={<CashRegisters />} />
                  <Route path="tags" element={<Tags />} />
                  <Route
                    path="offer-increase-options"
                    element={<OfferIncreaseOptions />}
                  />
                  <Route
                    path="sale-percentages"
                    element={<SalePercentages />}
                  />
                  <Route
                    path="programming-pricing"
                    element={<ProgrammingPricingAdmin />}
                  />
                  <Route path="iron-management" element={<IronManagement />} />
                </Route>

                <Route path="service-tasks" element={<ServiceTasks />} />
                <Route path="car-catalyst" element={<CarCatalystPage />} />
                <Route path="car-catalyst/details" element={<CarCatalystDetails />} />

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
                  <Route path="workshop-orders" element={<WorkshopOrdersReport />} />
                  <Route path="service-task-reports" element={<ServiceTasksReport />} />
                </Route>

                <Route path="finance-reports">
                  <Route
                    index
                    element={<Navigate to="shop-reports" replace />}
                  />
                  <Route path="dashboard" element={<DashboardReports />} />
                  <Route element={<FinanceReports />}>
                    <Route path="shop-reports" element={<ShopReports />} />
                    <Route path="service-reports" element={<ServiceReports />} />
                    <Route path="warehouse-reports" element={<WarehouseReports />} />
                    <Route path="sales-reports" element={<SalesReports />} />
                    <Route path="profit-summary" element={<ProfitSummary />} />
                    <Route path="profit-detailed" element={<ProfitDetailed />} />
                    <Route path="sale-profit" element={<SaleProfitLookup />} />
                    <Route
                      path="warehouse-inventory"
                      element={<WarehouseInventoryStatus />}
                    />
                    <Route path="shop-inventory" element={<ShopInventoryStatus />} />
                    <Route path="other-expenses" element={<OtherExpensesReports />} />
                  </Route>
                </Route>

                <Route path="warehouses" element={<Warehouses />}>
                  <Route
                    index
                    element={<Navigate to="total-batches" replace />}
                  />
                  <Route path="total-batches" element={<TotalBatches />} />
                  <Route path="batches-to-sale" element={<BatchesToSale />} />
                  <Route path="sold-batches" element={<SoldBatches />} />
                  <Route path="adjusted-sales" element={<AdjustedSales />} />
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
                <Route
                  path="carCatalyst"
                  element={<Navigate to="/car-catalyst" replace />}
                />
                <Route path="customers" element={<Customers />} />
                <Route path="calculator" element={<NewCalculator />} />
            <Route path="service-templates" element={<ServiceTemplatePage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>

        <ToastContainer {...toastOptions} />
      </OtpGateProvider>
    </Provider>
  );
};
