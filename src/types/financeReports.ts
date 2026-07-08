import type { DashboardOtherExpenseItem } from "@/types/otherExpenses";

export interface ShopReportSummaryResponse {
  shopId: number;
  fromDate: string;
  toDate: string;
  revenueFromProductSales: number;
  profitFromProductSales: number;
  totalQuantitySold: number;
  salesCount: number;
}

export interface ShopReportProductMetric {
  productId: number;
  productCode: string;
  productSku: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ShopReportInventoryProduct {
  productId: number;
  productCode: string;
  productSku: string;
  quantity: number;
  salePrice: number;
  avgCostPrice?: number;
  inventoryValue?: number;
  inventoryValueAtSalePrice?: number;
  inventoryValueAtCost?: number;
}

export interface ShopReportInventoryResponse {
  shopId: number;
  lowStockThreshold: number;
  currentInventoryValue: number;
  currentInventoryCostValue: number;
  lowStockProducts: ShopReportInventoryProduct[];
  outOfStockProducts: ShopReportInventoryProduct[];
}

export interface ShopReportInventoryAllProductsResponse {
  shopId: number;
  totalInventoryValueAtSalePrice: number;
  totalInventoryValueAtCost: number;
  products: ShopReportInventoryProduct[];
}

export interface ShopReportDateRangeParams {
  fromDate?: string;
  toDate?: string;
}

export interface ServiceReportServiceLine {
  id: number;
  serviceId: number;
  serviceName: string;
  serviceCategoryId: number;
  serviceCategoryName: string;
  employeeId: number;
  internalCost: number;
  customerPrice: number;
  profit: number;
}

export interface ServiceReportProductLine {
  id: number;
  productId: number;
  productCode: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ServiceReportOrderItem {
  id: number;
  serviceEstimateId: number;
  estimateNumber: string;
  vehicleBrandName: string;
  vehicleModelName: string;
  vehicleYear: number;
  vinCode: string;
  mileage: number;
  shopId: number;
  cashierUserId: number;
  productsTotal: number;
  servicesTotal: number;
  grandTotal: number;
  cashPaid: number;
  nonCashPaid: number;
  change: number;
  nonCashReference: string;
  status: string;
  createdAt: string;
  services: ServiceReportServiceLine[];
  products: ServiceReportProductLine[];
}

export interface ServiceEstimateReportResponse {
  orders: ServiceReportOrderItem[];
  totalProductsRevenue: number;
  totalServicesRevenue: number;
  totalGrandRevenue: number;
  totalServicesCost: number;
  totalServicesProfit: number;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface WarehouseStockItem {
  productId: number;
  productCode: string;
  productSku: string;
  warehouseId: number;
  quantity: number;
  purchaseCost: number;
  salePrice: number;
  stockValueAtCost: number;
  stockValueAtSalePrice: number;
}

export interface WarehouseStockResponse {
  warehouseId: number;
  totalValueAtCost: number;
  totalValueAtSalePrice: number;
  totalProducts: number;
  totalUnits: number;
  items: WarehouseStockItem[];
}

export interface WarehouseMovementItem {
  productId: number;
  productCode: string;
  productSku: string;
  movementType: number;
  quantity: number;
  unitCost: number;
  targetShopId: number;
  createdBy: string;
  occurredAt: string;
}

export interface WarehousePurchaseItem {
  productId: number;
  productCode: string;
  productSku: string;
  quantityAdded: number;
  unitCost: number;
  totalCost: number;
  purchasedAt: string;
}

export interface WarehouseVelocityItem {
  productId: number;
  productCode: string;
  productSku: string;
  currentWarehouseStock: number;
  totalUnitsSold: number;
  lastSoldAt: string;
  daysSinceLastSale: number;
}

export interface WarehouseTurnoverItem {
  productId: number;
  productCode: string;
  productSku: string;
  unitsSold: number;
  avgStockOnHand: number;
  turnoverRate: number;
}

export interface WarehouseFullReportResponse {
  warehouseId: number;
  fromDate?: string;
  toDate?: string;
  stockValuation: WarehouseStockResponse;
  inventoryMovements: WarehouseMovementItem[];
  purchaseHistory: WarehousePurchaseItem[];
  fastMovingProducts: WarehouseVelocityItem[];
  slowMovingProducts: WarehouseVelocityItem[];
  notSoldProducts: WarehouseVelocityItem[];
  inventoryTurnover: WarehouseTurnoverItem[];
}

export interface SalesRevenueByPeriodItem {
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  productSalesRevenue: number;
  serviceOrdersRevenue: number;
  totalRevenue: number;
  productSalesCount: number;
  serviceOrdersCount: number;
}

export interface SalesRevenueByEmployeeItem {
  employeeId: string;
  productSalesRevenue: number;
  serviceOrdersRevenue: number;
  totalRevenue: number;
  transactionCount: number;
}

export interface SalesRevenueByPaymentMethodItem {
  paymentMethod: string;
  amount: number;
  percentage: number;
}

export interface SalesRevenueSummary {
  shopId: number;
  fromDate: string;
  toDate: string;
  totalProductSalesRevenue: number;
  totalServiceOrdersRevenue: number;
  totalRevenue: number;
  totalCashRevenue: number;
  totalNonCashRevenue: number;
  productSalesCount: number;
  serviceOrdersCount: number;
}

export interface SalesRevenueFullResponse {
  summary: SalesRevenueSummary;
  revenueByPeriod: SalesRevenueByPeriodItem[];
  revenueByEmployee: SalesRevenueByEmployeeItem[];
  revenueByPaymentMethod: SalesRevenueByPaymentMethodItem[];
}

export interface DashboardStockAlertItem {
  productId: number;
  productCode: string;
  productSku: string;
  quantity: number;
  salePrice: number;
}

export interface DashboardReportResponse {
  shopId: number;
  generatedAt: string;
  todayRevenue: number;
  todayProfit: number;
  todaySalesCount: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  monthlySalesCount: number;
  totalProductRevenue: number;
  totalServiceRevenue: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockThreshold: number;
  lowStockAlertsCount: number;
  outOfStockCount: number;
  lowStockAlerts: DashboardStockAlertItem[];
  outOfStockAlerts: DashboardStockAlertItem[];
  monthlyOtherExpenses: number;
  otherExpenses: DashboardOtherExpenseItem[];
  monthlyNetProfit: number;
  todayNetProfit: number;
}
