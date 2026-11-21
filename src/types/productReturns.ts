export type ProductReturnCondition = 1 | 2 | 3;

export interface CreateProductReturnItemRequest {
  posSaleItemId: number;
  quantity: number;
  condition: ProductReturnCondition;
}

export interface CreateProductReturnRequest {
  idempotencyKey: string;
  reason: string;
  items: CreateProductReturnItemRequest[];
}

export interface InspectProductReturnRequest {
  condition: 1 | 2;
}

export interface ConfirmProductReturnLossRequest {
  notes: string;
}

export interface ProductReturnItem {
  id: number;
  posSaleItemId: number;
  productId: number;
  quantity: number;
  refundAmountAmd: number;
  costAmountAmd: number;
  initialCondition: ProductReturnCondition;
  condition: ProductReturnCondition;
  inspectedBy?: string | number | null;
  inspectedAt?: string | null;
  inspectionNotes?: string | null;
  lossConfirmedBy?: string | number | null;
  lossConfirmedAt?: string | null;
  lossConfirmationNotes?: string | null;
}

export interface ProductReturn {
  id: number;
  posSaleId: number;
  shopId: number;
  cashRegisterId: number;
  cashSessionId: number;
  reason: string;
  createdBy: string | number;
  createdAt: string;
  totalRefundAmountAmd: number;
  cashRefundAmountAmd: number;
  nonCashRefundAmountAmd: number;
  items: ProductReturnItem[];
}

