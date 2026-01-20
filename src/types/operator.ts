export interface CustomerType {
  id?: number;
  code?: string;
  bonusPercent?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface Customer {
  id?: number;
  phone?: string;
  fullName?: string | null;
  notes?: string | null;
  customerTypeId?: number;
  customerType?: CustomerType;
}

export interface Intake {
  id?: number;
  shopId: number;
  customerPhone: string;
  powderWeightTotal: number;
  ptWeight: number;
  pdWeight: number;
  rhWeight: number;
  currencyCode: string;
  customer?: Customer;
}
