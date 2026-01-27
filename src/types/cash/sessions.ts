export interface GetRegisterSession {
  hasOpenSession: boolean;
  sessionId: number;
  cashBoxId: number;
  openedAtUtc: string;
}
