import api from ".";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type {
  ConvertEstimateToOrderRequest,
  ConvertEstimateToOrderResponse,
  Intake,
  IntakeResponse,
  NewPropose,
  ServiceEstimateLookupResponse,
  ServiceEstimateRequest,
  ServiceEstimateResponse,
  WorkshopOrder,
} from "@/types/operator";

export const createIntake = async ({
  intake,
  cashRegisterId,
}: {
  intake: Intake;
  cashRegisterId: number;
}): Promise<IntakeResponse> => {
  try {
    const response = await api.post(`/catalyst/intakes`, intake, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create intake."));
  }
};

export const getIntake = async ({
  intakeId,
  cashRegisterId,
}: {
  intakeId: number;
  cashRegisterId: number;
}): Promise<IntakeResponse> => {
  try {
    const response = await api.get(`/catalyst/intakes/${intakeId}`, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get intake."));
  }
};

export const acceptIntake = async ({
  intakeId,
  cashRegisterId,
  paymentType = 1,
}: {
  intakeId: number;
  cashRegisterId: number;
  paymentType?: number;
}): Promise<Intake> => {
  try {
    const response = await api.post(
      `/catalyst/intakes/${intakeId}/accept`,
      {
        cashRegisterId,
        paymentType,
      },
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to accept intake."));
  }
};

export const rejectIntake = async ({
  intakeId,
  cashRegisterId,
}: {
  intakeId: number;
  cashRegisterId: number;
}) => {
  try {
    const response = await api.post(
      `/catalyst/intakes/${intakeId}/reject`,
      {},
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to reject intake."));
  }
};

export const createServiceOrder = async ({
  order,
  cashRegisterId,
}: {
  order: ServiceEstimateRequest;
  cashRegisterId?: number;
}): Promise<ServiceEstimateResponse> => {
  try {
    const response = await api.post(`/ServiceEstimate`, order, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create service estimate."));
  }
};

export const getServiceOrders = async ({
  cashRegisterId,
}: {
  cashRegisterId?: number;
}): Promise<WorkshopOrder[]> => {
  try {
    const response = await api.get(`/operator/orders`, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to load workshop orders."));
  }
};

export const getServiceEstimateByNumber = async ({
  estimateNumber,
  cashRegisterId,
}: {
  estimateNumber: string;
  cashRegisterId?: number;
}): Promise<ServiceEstimateLookupResponse> => {
  const normalizedNumber = estimateNumber.trim();

  if (!normalizedNumber) {
    throw new Error("Estimate number is required.");
  }

  const normalizedCashRegisterId = Number(cashRegisterId);
  if (!Number.isFinite(normalizedCashRegisterId) || normalizedCashRegisterId <= 0) {
    throw new Error("Missing or invalid X-CashRegister-Id header.");
  }

  const headers = getHeaders(normalizedCashRegisterId);

  const maybeEstimateId = Number(normalizedNumber);
  const canTryById = Number.isInteger(maybeEstimateId) && maybeEstimateId > 0;

  if (canTryById) {
    try {
      const byIdResponse = await api.get(`/ServiceEstimate/${maybeEstimateId}`, {
        headers,
      });
      return byIdResponse.data;
    } catch {
      // Continue to estimate-number lookup fallback chain.
    }
  }

  try {
    const response = await api.get(
      `/ServiceEstimate/number/${encodeURIComponent(normalizedNumber)}`,
      { headers },
    );
    return response.data;
  } catch {
    try {
      const response = await api.get(`/ServiceEstimate`, {
        headers,
        params: { estimateNumber: normalizedNumber },
      });

      if (Array.isArray(response.data)) {
        const matched = response.data.find(
          (item: Record<string, unknown>) =>
            String(item.estimateNumber || "").toLowerCase() ===
            normalizedNumber.toLowerCase(),
        );

        if (!matched) {
          throw new Error("Service estimate not found.");
        }

        return matched as ServiceEstimateLookupResponse;
      }

      return response.data as ServiceEstimateLookupResponse;
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(error, "Failed to find service estimate by number."),
      );
    }
  }
};

export const confirmServiceEstimate = async ({
  estimateId,
  cashRegisterId,
}: {
  estimateId: number;
  cashRegisterId?: number;
}) => {
  const normalizedCashRegisterId = Number(cashRegisterId);
  if (!Number.isFinite(normalizedCashRegisterId) || normalizedCashRegisterId <= 0) {
    throw new Error("Missing or invalid X-CashRegister-Id header.");
  }

  const headers = getHeaders(normalizedCashRegisterId);
  const body = {
    paymentType: 1,
  };

  try {
    const response = await api.post(`/ServiceEstimate/${estimateId}/confirm`, body, {
      headers,
    });
    return response.data;
  } catch {
    try {
      const response = await api.post(
        `/ServiceEstimate/${estimateId}/confirm-payment`,
        body,
        {
          headers,
        },
      );
      return response.data;
    } catch {
      try {
        const response = await api.post(
          `/ServiceEstimate/confirm`,
          {
            estimateId,
            ...body,
          },
          {
            headers,
          },
        );
        return response.data;
      } catch (error: unknown) {
        throw new Error(
          getApiErrorMessage(error, "Failed to confirm service estimate."),
        );
      }
    }
  }
};

export const convertServiceEstimateToOrder = async ({
  payload,
  cashRegisterId,
}: {
  payload: ConvertEstimateToOrderRequest;
  cashRegisterId?: number;
}): Promise<ConvertEstimateToOrderResponse> => {
  const normalizedCashRegisterId = Number(cashRegisterId);
  if (!Number.isFinite(normalizedCashRegisterId) || normalizedCashRegisterId <= 0) {
    throw new Error("Missing or invalid X-CashRegister-Id header.");
  }

  try {
    const response = await api.post(`/ServiceEstimate/convert-to-order`, payload, {
      headers: getHeaders(normalizedCashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to convert estimate to order."));
  }
};

export const proposeNewOffer = async ({
  intakeId,
  cashRegisterId,
}: {
  intakeId: number;
  cashRegisterId: number;
}) => {
  try {
    const response = await api.post<NewPropose>(
      `/catalyst/intakes/${intakeId}/new-offer`,
      {},
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to propose new offer."));
  }
};

export const offerIntake = async ({
  intakeId,
  cashRegisterId,
}: {
  intakeId: number;
  cashRegisterId: number;
}) => {
  try {
    const response = await api.post(
      `/catalyst/intakes/${intakeId}/offer`,
      {},
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to offer intake."));
  }
};

export const getServiceTasksWithoutPrice = async ({
  cashRegisterId,
}: {
  cashRegisterId?: number;
}): Promise<{ id: number; code: string }[]> => {
  try {
    const response = await api.get(`/admin/service-tasks/without-price`, {
      headers: getHeaders(cashRegisterId),
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to load service tasks."));
  }
};

export const payServiceTasks = async ({
  cashRegisterId,
  items,
}: {
  cashRegisterId?: number;
  items: Array<{
    serviceTaskId: number;
    price: number;
    paymentType: number;
  }>;
}) => {
  try {
    const response = await api.post(
      `/admin/service-tasks/bulkpurchase`,
      { items },
      {
        headers: getHeaders(cashRegisterId),
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to pay service tasks."));
  }
};

export const getServiceTasksReport = async ({
  cashRegisterId,
  from,
  to,
  userId,
  paymentType,
}: {
  cashRegisterId?: number;
  from?: string;
  to?: string;
  userId?: string;
  paymentType?: number;
}) => {
  try {
    const response = await api.get(`/admin/service-tasks/report`, {
      headers: getHeaders(cashRegisterId),
      params: {
        from,
        to,
        userId,
        paymentType,
      },
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch service task report."));
  }
};
