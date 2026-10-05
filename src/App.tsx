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
import {
  ReferralCommissionDetails,
  ReferralCommissions,
  ReferralPersonCommissionRuleForm,
  ReferralPersonDetails,
  ReferralPersonForm,
  ReferralPersons,
} from "@/pages/ReferralPersons";

// Repayment Rules pages
import {
  RepaymentRules,
  CreateRepaymentRule,
  RepaymentRuleDetails,
  CreateRepaymentRuleVersion,
  RepaymentRuleVersionDetails,
} from "@/pages/RepaymentRules";
import {
  AgentAdvanceDetails,
  AgentAdvancesList,
  AgentContractDetails,
  AgentContractsList,
  CreateAgentContract,
} from "@/pages/AgentContracts";
import {
  CreatePowderDelivery,
  PowderDeliveryDetails,
  PowderDeliveryHistory,
  PowderDeliveriesList,
} from "@/pages/PowderDeliveries";

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
import { IronShopSettings } from "@/components/settings/IronShop";
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
import { IronPurchasesReport } from "@/components/reports/IronPurchasesReport";
import { WorkshopOrdersReport } from "@/components/reports/WorkshopOrdersReport";
import { ServiceTasksReport } from "@/components/reports/ServiceTasksReport";
import { SpecialLotsReport } from "@/components/reports/SpecialLotsReport";

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
import { CatalyticConverters } from "./pages/CatalyticConverters";
import { CatalyticConverterDetails } from "./pages/CatalyticConverters/CatalyticConverterDetails";
import { CatalyticSuppliers } from "./pages/CatalyticSuppliers";
import { Agents, CreateAgent, EditAgent, AgentDetails, AgentFinancialSummary, ClassifyAgent, AgentTypes, CreateEditAgentType, ClassificationRules, CreateEditClassificationRule, AgentWorkspace, AgentProductCreditPage, AgentProductCreditContractDetails } from "./pages/Agents";
import {
  CapitalSourceDetails,
  CapitalSourcesList,
  CreateCapitalSource,
  EditCapitalSource,
} from "./pages/CapitalSources";
import { RepaymentDetails, RepaymentManagement } from "./pages/Repayments";

const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
  theme: "dark",
  toastClassName: "success-toast",
  icon: ({ type }: { type?: string }) =>
    type === "success" ? (
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 999, background: "rgba(42, 168, 72, 0.18)", color: "#7ae39a", fontSize: 18, fontWeight: 700 }}>✓</span>
    ) : (
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 999, background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 18 }}>•</span>
    ),
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
                  <Route path="iron-management" element={<IronShopSettings />} />
                </Route>

                <Route path="service-tasks" element={<ServiceTasks />} />
                <Route path="car-catalyst" element={<CarCatalystPage />} />
                <Route path="car-catalyst/details" element={<CarCatalystDetails />} />
                <Route
                  path="catalytic-converters"
                  element={<CatalyticConverters />}
                />
                <Route
                  path="catalytic-converters/:id"
                  element={<CatalyticConverterDetails />}
                />

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
                  <Route path="iron-purchases" element={<IronPurchasesReport />} />
                  <Route path="workshop-orders" element={<WorkshopOrdersReport />} />
                  <Route path="service-task-reports" element={<ServiceTasksReport />} />
                  <Route path="special-lots" element={<SpecialLotsReport />} />
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
                <Route path="agents" element={<AgentWorkspace />}>
                  <Route index element={<Agents />} />
                  <Route path="new" element={<CreateAgent />} />
                  <Route path=":id" element={<AgentDetails />} />
                  <Route path=":id/financial-summary" element={<AgentFinancialSummary />} />
                  <Route path=":id/edit" element={<EditAgent />} />
                  <Route path=":id/classify" element={<ClassifyAgent />} />
                  <Route path=":id/powder-deliveries" element={<PowderDeliveryHistory kind="agent" />} />
                  <Route path="types" element={<AgentTypes />} />
                  <Route path="types/new" element={<CreateEditAgentType />} />
                  <Route path="types/:id" element={<CreateEditAgentType />} />
                  <Route path="classification-rules" element={<ClassificationRules />} />
                  <Route path="classification-rules/new" element={<CreateEditClassificationRule />} />
                  <Route path="classification-rules/:id" element={<CreateEditClassificationRule />} />
                  <Route path="cash-powder/contracts" element={<AgentContractsList />} />
                  <Route path="cash-powder/contracts/create" element={<CreateAgentContract />} />
                  <Route path="cash-powder/contracts/:id/edit" element={<CreateAgentContract />} />
                  <Route path="cash-powder/contracts/:id/powder-deliveries" element={<PowderDeliveryHistory kind="contract" />} />
                  <Route path="cash-powder/contracts/:id" element={<AgentContractDetails />} />
                  <Route path="cash-powder/advances" element={<AgentAdvancesList />} />
                  <Route path="cash-powder/advances/:id" element={<AgentAdvanceDetails />} />
                  <Route path="cash-powder/deliveries" element={<PowderDeliveriesList />} />
                  <Route path="cash-powder/deliveries/create" element={<CreatePowderDelivery />} />
                  <Route path="cash-powder/deliveries/:id" element={<PowderDeliveryDetails />} />
                  <Route path="cash-powder/repayments" element={<RepaymentManagement />} />
                  <Route path="cash-powder/repayments/:id" element={<RepaymentDetails />} />
                  <Route path="cash-powder/rules" element={<RepaymentRules />} />
                  <Route path="cash-powder/rules/create" element={<CreateRepaymentRule />} />
                  <Route path="cash-powder/rules/:id" element={<RepaymentRuleDetails />} />
                  <Route path="cash-powder/rules/:id/versions/create" element={<CreateRepaymentRuleVersion />} />
                  <Route path="cash-powder/rules/versions/:versionId" element={<RepaymentRuleVersionDetails />} />
                  <Route path="product-credit/contracts" element={<AgentProductCreditPage view="contracts" />} />
                  <Route path="product-credit/contracts/create" element={<CreateAgentContract productCreditMode />} />
                  <Route path="product-credit/contracts/:id/edit" element={<CreateAgentContract productCreditMode />} />
                  <Route path="product-credit/contracts/:id" element={<AgentProductCreditContractDetails />} />
                  <Route path="product-credit/advances" element={<AgentProductCreditPage view="advances" />} />
                  <Route path="product-credit/sales" element={<AgentProductCreditPage view="sales" />} />
                  <Route path="product-credit/debt" element={<AgentProductCreditPage view="debt" />} />
                  <Route path="product-credit/payments" element={<AgentProductCreditPage view="payments" />} />
                </Route>
                <Route path="agent-types" element={<Navigate to="/agents/types" replace />} />
                <Route path="agent-types/new" element={<CreateEditAgentType />} />
                <Route path="agent-types/:id" element={<CreateEditAgentType />} />
                <Route path="agent-classification-rules" element={<Navigate to="/agents/classification-rules" replace />} />
                <Route path="agent-classification-rules/new" element={<CreateEditClassificationRule />} />
                <Route path="agent-classification-rules/:id" element={<CreateEditClassificationRule />} />
                
                {/* Repayment Rules under Agents business logic */}
                <Route path="agents/repayment-rules" element={<Navigate to="/agents/cash-powder/rules" replace />} />
                <Route path="agents/repayment-rules/create" element={<CreateRepaymentRule />} />
                <Route path="agents/repayment-rules/:id/versions/create" element={<CreateRepaymentRuleVersion />} />
                <Route path="agents/repayment-rules/versions/:versionId" element={<RepaymentRuleVersionDetails />} />
                <Route path="agents/repayment-rules/:id" element={<RepaymentRuleDetails />} />
                <Route path="agent-contracts" element={<Navigate to="/agents/cash-powder/contracts" replace />} />
                <Route path="agent-contracts/create" element={<CreateAgentContract />} />
                <Route path="agent-contracts/:id/edit" element={<CreateAgentContract />} />
                <Route path="agent-contracts/:id" element={<AgentContractDetails />} />
                <Route path="agent-contracts/:id/powder-deliveries" element={<PowderDeliveryHistory kind="contract" />} />
                <Route path="repayments" element={<Navigate to="/agents/cash-powder/repayments" replace />} />
                <Route path="repayments/:id" element={<RepaymentDetails />} />
                <Route path="agent-advances" element={<Navigate to="/agents/cash-powder/advances" replace />} />
                <Route path="agent-advances/:id" element={<AgentAdvanceDetails />} />
                <Route path="powder-deliveries" element={<Navigate to="/agents/cash-powder/deliveries" replace />} />
                <Route path="powder-deliveries/create" element={<CreatePowderDelivery />} />
                <Route path="powder-deliveries/:id" element={<PowderDeliveryDetails />} />
                <Route
                  path="carCatalyst"
                  element={<Navigate to="/car-catalyst" replace />}
                />
                <Route path="customers" element={<Customers />} />
                <Route path="capital-sources" element={<CapitalSourcesList />} />
                <Route path="capital-sources/create" element={<CreateCapitalSource />} />
                <Route path="capital-sources/:id" element={<CapitalSourceDetails />} />
                <Route path="capital-sources/:id/edit" element={<EditCapitalSource />} />
                <Route path="referral-persons" element={<ReferralPersons />} />
                <Route path="referral-persons/create" element={<ReferralPersonForm />} />
                <Route path="referral-persons/:id" element={<ReferralPersonDetails />} />
                <Route path="referral-persons/:id/edit" element={<ReferralPersonForm />} />
                <Route path="referral-persons/:personId/commission-rules/new" element={<ReferralPersonCommissionRuleForm />} />
                <Route path="commissions" element={<ReferralCommissions />} />
                <Route path="commissions/:id" element={<ReferralCommissionDetails />} />
                <Route path="catalytic-suppliers" element={<CatalyticSuppliers />} />
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
