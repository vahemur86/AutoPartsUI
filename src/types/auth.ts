export interface Credentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  userType: string;
  shopId: number;
  warehouseId: number;
}
