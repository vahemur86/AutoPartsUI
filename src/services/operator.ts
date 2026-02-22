import api from ".";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";

// types
import type { Intake, IntakeResponse, NewPropose } from "@/types/operator";

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
