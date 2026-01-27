export interface PaginatedResponse<T> {
  totalItems: number;
  page: number;
  pageSize: number;
  results: T[];
}

export interface BatchItem {
  id: number;
  intakeId: number;
  powderKg: number;
  ptTotal_g: number;
  pdTotal_g: number;
  rhTotal_g: number;
}

export interface Batch {
  id: number;
  sessionId: number;
  cashBoxId: number;
  intakeCount: number;
  totalPowderKg: number;
  ptTotal_g: number;
  pdTotal_g: number;
  rhTotal_g: number;
  ptPerKg_g: number;
  pdPerKg_g: number;
  rhPerKg_g: number;
  status: number;
  createdAt: string;
}

export interface BatchDetails extends Batch {
  items: BatchItem[];
}

export interface ZReport {
  id: number;
  sessionId: number;
  cashBoxId: number;
  operatorUserId: number;
  openedAt: string;
  closedAt: string;
  intakeCount: number;
  totalPurchasesAmd: number;
  totalCashInAmd: number;
  totalCashOutAmd: number;
  diffPurchasesVsCashOutAmd: number;
}

export interface CashboxReport {
  cashBoxId: number;
  date: string;
  openingBalanceAmd: number;
  cashInAmd: number;
  cashOutAmd: number;
  expectedClosingBalanceAmd: number;
}

export type BatchResponse = PaginatedResponse<Batch>;
export type ZReportResponse = PaginatedResponse<ZReport>;
