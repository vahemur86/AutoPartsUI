import { getCashRegisters } from "@/services/settings/cash/registers";
import {
  OtherExpenseLocationType,
  type OtherExpenseItem,
} from "@/types/otherExpenses";
import type { CashRegister, CashRegisterListResponse } from "@/types/cash";
import type { Shop } from "@/types/settings";

const normalizeRegisters = (
  response: CashRegisterListResponse,
): CashRegister[] => Array.isArray(response) ? response : response.items;

export const getExpenseRegisterShopIds = (
  locationType: OtherExpenseItem["locationType"],
  locationId: number,
  shops: Shop[],
): number[] => {
  if (locationType === OtherExpenseLocationType.Shop) return [locationId];

  return shops
    .filter((shop) => shop.warehouseId === locationId)
    .map((shop) => shop.id);
};

export const loadCashRegisters = async (
  shopIds?: number[],
  activeOnly = false,
): Promise<CashRegister[]> => {
  const uniqueShopIds = [...new Set(shopIds ?? [])];
  const responses = uniqueShopIds.length
    ? await Promise.all(uniqueShopIds.map((shopId) => getCashRegisters(shopId)))
    : [await getCashRegisters()];
  const registers = responses.flatMap(normalizeRegisters);
  const registersById = new Map<number, CashRegister>();

  for (const register of registers) {
    if (!activeOnly || register.isActive) registersById.set(register.id, register);
  }

  return [...registersById.values()];
};

export const loadActiveCashRegisters = (
  shopIds?: number[],
): Promise<CashRegister[]> => loadCashRegisters(shopIds, true);
