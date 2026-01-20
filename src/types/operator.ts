export interface MetalRate {
  id: number;
  currencyCode: string;
  ptPricePerGram: number;
  pdPricePerGram: number;
  rhPricePerGram: number;
  effectiveFrom: string;
  isActive: boolean;
}
