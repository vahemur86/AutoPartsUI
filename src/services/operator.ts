import api from ".";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { Intake } from "@/types/operator";

export const createIntake = async ({
  intake,
  cashRegisterId,
}: {
  intake: Intake;
  cashRegisterId: number;
}) => {
  try {
    const response = await api.post(`/catalyst/intakes`, intake, {
      headers: {
        "X-CashRegister-Id": cashRegisterId,
      },
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
}) => {
  try {
    const response = await api.get(`/catalyst/intakes/${intakeId}`, {
      headers: {
        "X-CashRegister-Id": cashRegisterId,
      },
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
        headers: {
          "X-CashRegister-Id": cashRegisterId,
        },
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
        headers: {
          "X-CashRegister-Id": cashRegisterId,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to reject intake."));
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
        headers: {
          "X-CashRegister-Id": cashRegisterId,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to offer intake."));
  }
};

export const recalculateIntake = async (intakeId: number) => {
  try {
    const response = await api.post(
      `/catalyst/intakes/${intakeId}/recalculate`,
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to recalculate intake."));
  }
};
