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

export interface DashboardOtherExpenseItem {
  serviceName: string;
  amount: number;
  paymentDay: number;
}