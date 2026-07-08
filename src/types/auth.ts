export interface Credentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  userType: string;
  shopId: number | null;
  warehouseId: number | null;
  cashRegisterId?: number | null;
  cashRegisterName?: string | null;
}
