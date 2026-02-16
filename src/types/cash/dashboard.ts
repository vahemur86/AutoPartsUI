export interface OpenSession {
  sessionId: number;
  cashBoxId: number;
  cashBoxCode: string;
  operatorUserId: number;
  operatorUsername: string;
  openedAt: string;
}

export interface OpenSessionSummary extends OpenSession {
  intakesOfferedCount: number;
  intakesAcceptedCount: number;
  acceptedPowderKg: number;
  purchasesAmd: number;
  cashInAmd: number;
  cashOutAmd: number;
  diffAmd: number;
  lastActivityAt: string;
}

export interface PowderBatchItem {
  id: number;
  intakeId: number;
  powderKg: number;
  ptTotal_g: number;
  pdTotal_g: number;
  rhTotal_g: number;
}

export interface PowderBatchesSummary {
  totalPowderKg: number;
  ptTotal_g: number;
  pdTotal_g: number;
  rhTotal_g: number;
  ptPerKg_g: number;
  pdPerKg_g: number;
  rhPerKg_g: number;
  batchCount: number;
}

export interface PowderBatch {
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
  avgFxRateToAmd: number;
  avgPdPricePerKg: number;
  avgPtPricePerKg: number;
  avgRhPricePerKg: number;
  status: number;
  createdAt: string;
}

export interface PowderBatchDetails extends PowderBatch {
  items: PowderBatchItem[];
}

export type PowderBatchResponse =
  import("./cashboxSessions").PaginatedResponse<PowderBatch>;

export type GetPowderBatchesParams = {
  fromDate?: string;
  toDate?: string;
  cashRegisterId: number;
  page?: number;
  pageSize?: number;
};
