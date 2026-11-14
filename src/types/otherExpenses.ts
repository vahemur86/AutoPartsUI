export const OtherExpenseLocationType = {
  Shop: 1,
  Warehouse: 2,
} as const;

export type OtherExpenseLocationType =
  (typeof OtherExpenseLocationType)[keyof typeof OtherExpenseLocationType];

export interface OtherExpenseItem {
  id: number;
  locationId: number;
  locationType: OtherExpenseLocationType;
  locationName: string;
  serviceName: string;
  amount: number;
  paymentDay: number;
  isActive: boolean;
  createdAt: string;
}

export interface OtherExpenseCreatePayload {
  locationId: number;
  locationType: OtherExpenseLocationType;
  serviceName: string;
  amount: number;
  paymentDay: number;
}

export interface OtherExpenseUpdatePayload {
  serviceName: string;
  amount: number;
  paymentDay: number;
}

export interface OtherExpenseReportItem {
  locationId: number;
  locationName: string;
  locationType: OtherExpenseLocationType;
  totalMonthlyExpense: number;
  expenses: OtherExpenseItem[];
}

export const OtherExpensePaymentMethod = {
  Cash: "Cash",
  NonCash: "NonCash",
} as const;

export type OtherExpensePaymentMethod =
  (typeof OtherExpensePaymentMethod)[keyof typeof OtherExpensePaymentMethod];

export interface OtherExpensePaymentPayload {
  cashAmount: number;
  cashRegisterId: number | null;
  nonCashAmount: number;
  comment?: string | null;
}

export interface OtherExpensePaymentItem {
  id: number;
  otherExpenseId: number;
  serviceName: string;
  totalAmount: number;
  cashAmount: number;
  cashRegisterId: number | null;
  nonCashAmount: number;
  paidAt: string;
  createdByUserId: number;
  comment: string | null;
}

export interface OtherExpensePaymentReport {
  totalCount: number;
  page: number;
  pageSize: number;
  totalCashAmount: number;
  totalNonCashAmount: number;
  payments: OtherExpensePaymentItem[];
}

export interface OtherExpensePaymentFilters {
  fromDate?: string;
  toDate?: string;
  cashRegisterId?: number;
  method?: OtherExpensePaymentMethod;
  page?: number;
  pageSize?: number;
}

export interface OtherExpensePaymentsReportFilters
  extends OtherExpensePaymentFilters {
  locationId?: number;
  locationType?: OtherExpenseLocationType;
}

export interface DashboardOtherExpenseItem {
  serviceName: string;
  amount: number;
  paymentDay: number;
}