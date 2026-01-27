export interface CashRegister {
  id: number;
  shopId: number;
  code: string;
  description: string;
  isActive: boolean;
}

export interface CashRegisterBalance {
  cashRegisterId: number;
  balance: number;
  openSessionId: number | null;
}

export interface TopUpRequest {
  amount: number;
  currencyCode: string;
  comment: string;
}
