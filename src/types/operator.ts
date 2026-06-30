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

export const PaymentMethod = {
  Cash: 1,
  NonCash: 2,
  Card: 3,
  EWallet: 4,
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];


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
  appliedPercent: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceItems: any[];
}

export interface ServiceOrderRequest {
  templateId: number;
  isManualMode: boolean;
  mechanicPrice: number;
  electricianPrice: number;
  sparePartsPrice: number;
  vinCode: string;
  mileageKm: number;
  comment: string;
}

export interface ServiceEstimateRequestLine {
  serviceId: number;
  customerPrice: number;
  employeeId?: number;
}

export interface ServiceEstimateRequest {
  vehicleBrandId: number;
  vehicleModelId: number;
  vehicleYear: number;
  vehicleDefinitionId: number | null;
  vehicleFuelTypeId: number;
  vehicleEngineId: number;
  location: string;
  vinCode: string;
  mileage: number;
  notes: string;
  services: ServiceEstimateRequestLine[];
}

export interface ServiceEstimateResponse {
  id: number;
  estimateNumber: string;
}

export interface WorkshopFormData {
  selectedTemplateId: string;
  isManualMode: boolean;
  mechanicPrice: string;
  electricianPrice: string;
  sparePartsPrice: string;
  comment: string;
}

export interface WorkshopOrder {
  id: number;
  templateId: number;
  isManualMode: boolean;
  mechanicPrice: number;
  electricianPrice: number;
  sparePartsPrice: number;
  totalAmount: number;
  comment: string;
  operatorUserId: number;
  cashRegisterId: number;
  sessionId: number;
  createdAt: string;
}

export interface ServiceTasksReportItem {
  paymentId: number;
  createdAt: string;
  createdByUserId: string;
  totalAmount: number;
  cashTotal: number;
  nonCashTotal: number;
  items: Array<{
    serviceTaskId: number;
    serviceTaskCode: string;
    price: number;
    paymentType: number;
  }>;
}

export interface ServiceTaskReportRow {
  paymentId: number;
  createdAt: string;
  createdByUserId: string;
  totalAmount: number;
  cashTotal: number;
  nonCashTotal: number;
  serviceTaskCode: string;
  price: number;
  paymentType: number;
}

export interface NewPropose {
  intakeId: number;
  baseOfferAmd: number;
  stepOrder: number;
  percent: number;
  offeredAmountAmd: number;
  offeredAt: string;
}
export interface CustomerSearchResult {
  id: number;
  name: string;
  phone: string;
  displayName: string;
}