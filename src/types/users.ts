export interface User {
  id: number;
  username: string;
  role: string;
  userType: string;
  shopId: number | null;
  warehouseId: number | null;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  id: number;
  role: string;
  userType: string;
  shopId: number | null;
  warehouseId: number | null;
  isActive: boolean;
  password?: string;
}

export interface CreateUserPayload {
  email: string;
  role: string;
  userType: string;
  shopId: number | null;
  warehouseId: number | null;
  username: string;
}
