// services
import api from "..";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type { OfferIncreaseOption } from "@/types/settings";

interface Params {
  shopId: number;
  cashRegisterId?: number;
}

const getEndpoint = (shopId: number, id?: number) =>
  `/admin/shops/${shopId}/catalyst/offer-increase-options${id ? `/${id}` : ""}`;

export const getOfferIncreaseOptions = async ({
  shopId,
  cashRegisterId,
}: Params): Promise<OfferIncreaseOption[]> => {
  try {
    const { data } = await api.get<OfferIncreaseOption[]>(getEndpoint(shopId), {
      headers: getHeaders(cashRegisterId),
    });
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch offer increase options."),
    );
  }
};

export const createOrUpdateOfferIncreaseOption = async ({
  shopId,
  cashRegisterId,
  percent,
  isActive,
  id,
  action = "create",
}: Params & {
  percent: number;
  isActive: boolean;
  id?: number;
  action?: "create" | "update";
}) => {
  const isUpdate = action === "update";
  const method = isUpdate ? "put" : "post";
  const url = getEndpoint(shopId, isUpdate ? id : undefined);

  try {
    const response = await api[method](
      url,
      { percent, isActive },
      { headers: getHeaders(cashRegisterId) },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, `Failed to ${action} offer increase option.`),
    );
  }
};

export const deleteOfferIncreaseOption = async ({
  shopId,
  cashRegisterId,
  id,
}: Params & { id: number }) => {
  // Made ID required here for safety
  try {
    const { data } = await api.delete(getEndpoint(shopId, id), {
      headers: getHeaders(cashRegisterId),
    });
    return data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Failed to delete offer increase option."),
    );
  }
};
