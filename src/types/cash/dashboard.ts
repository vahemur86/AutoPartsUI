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
