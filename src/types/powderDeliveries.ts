import type { AgentSummaryDto, PagedResult } from "./agentContracts";

export type PowderDeliveryStatus = "Draft" | "Valuated" | "Confirmed" | "Cancelled";

export interface AgentContractReferenceDto {
  id: string;
  contractNumber: string;
}

export interface AgentAdvanceReferenceDto {
  id: string;
  advanceNumber: string;
}

export interface PowderPriceSnapshotDto {
  id: string;
  priceDate: string;
  ptPriceUsdPerGram: number;
  pdPriceUsdPerGram: number;
  rhPriceUsdPerGram: number;
  usdAmdRate: number;
  source: string;
  capturedAt: string;
  createdAt: string;
  createdBy: string;
}

export interface PowderDeliveryListItemDto {
  id: string;
  deliveryNumber: string;
  agent: AgentSummaryDto;
  contract: AgentContractReferenceDto;
  advance: AgentAdvanceReferenceDto | null;
  deliveryDate: string;
  netWeightKg: number;
  totalValueAmd: number | null;
  status: PowderDeliveryStatus;
  createdAt: string;
}

export interface PowderDeliveryDto extends PowderDeliveryListItemDto {
  grossWeightKg: number;
  ptGrams: number;
  pdGrams: number;
  rhGrams: number;
  ptValueUsd: number | null;
  pdValueUsd: number | null;
  rhValueUsd: number | null;
  totalValueUsd: number | null;
  notes: string | null;
  priceSnapshot: PowderPriceSnapshotDto | null;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface CreatePowderDeliveryRequest {
  agentId: string;
  agentContractId: string;
  agentAdvanceId: string | null;
  deliveryDate: string;
  grossWeightKg: number;
  netWeightKg: number;
  ptGrams: number;
  pdGrams: number;
  rhGrams: number;
  notes: string | null;
}

export type PagedPowderDeliveries = PagedResult<PowderDeliveryListItemDto>;