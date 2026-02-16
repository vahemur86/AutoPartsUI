export interface CustomerType {
  id?: number;
  code?: string;
  bonusPercent?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface Customer {
  id: number;
  phone: string;
  fullName: string | null;
  gender: number;
  notes: string | null;
  customerTypeId: number;
  customerType: CustomerType;
  createdAt?: string;
  updatedAt?: string;
}

export interface IntakeCustomer {
  phone: string;
  fullName: string;
  gender: number;
  notes?: string;
}

export interface CreateCustomerRequest {
  phone: string;
  fullName: string;
  gender: number;
  notes?: string;
}

export interface CustomersResponse {
  results: Customer[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export interface Intake {
  id?: number;
  shopId: number;
  customer: IntakeCustomer;
  powderWeightTotal: number;
  ptWeight: number;
  pdWeight: number;
  rhWeight: number;
  currencyCode: string;
}

export interface IntakeResponse {
  id: number;
  shopId: number;
  operatorUserId: number;
  customerId: number;
  customer: {
    id: number;
    phone: string;
    gender: number;
    customerTypeId: number;
    customerType: {
      id: number;
      code: string;
      isDefault: boolean;
      bonusPercent: number;
      isActive: boolean;
      createdAt: string;
    };
    fullName: string | null;
    notes: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  powderWeightTotal: number;
  ptWeight: number;
  pdWeight: number;
  rhWeight: number;
  offerPrice: number;
  currencyCode: string;
  status: number;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceItems: any[];
}

export interface NewPropose {
  intakeId: number;
  baseOfferAmd: number;
  stepOrder: number;
  percent: number;
  offeredAmountAmd: number;
  offeredAt: string;
}
