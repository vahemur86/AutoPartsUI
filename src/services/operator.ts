import api from ".";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { Intake } from "@/types/operator";

export const createIntake = async (intake: Intake) => {
  try {
    const response = await api.post(`/catalyst/intakes`, intake);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create intake."));
  }
};

export const getIntake = async (intakeId: number) => {
  try {
    const response = await api.get(`/catalyst/intakes/${intakeId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get intake."));
  }
};

export const acceptIntake = async (intakeId: number): Promise<Intake> => {
  try {
    const response = await api.post(`/catalyst/intakes/${intakeId}/accept`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to accept intake."));
  }
};

export const rejectIntake = async (intakeId: number) => {
  try {
    const response = await api.post(`/catalyst/intakes/${intakeId}/reject`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to reject intake."));
  }
};

export const offerIntake = async (intakeId: number) => {
  try {
    const response = await api.post(`/catalyst/intakes/${intakeId}/offer`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to offer intake."));
  }
};

export const recalculateIntake = async (intakeId: number) => {
  try {
    const response = await api.post(
      `/catalyst/intakes/${intakeId}/recalculate`
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to recalculate intake."));
  }
};
