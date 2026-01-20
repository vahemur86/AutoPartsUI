import api from "..";

import { getApiErrorMessage } from "@/utils";

export type LocalizedText = {
  id: number;
  entityName: string;
  entityId: number;
  fieldName: string;
  languageCode: string;
  value: string;
};

export type CreateTranslationPayload = {
  entityName: string;
  entityId: number;
  fieldName: string;
  languageCode: string;
  value: string;
};

export const createTranslation = async (payload: CreateTranslationPayload) => {
  try {
    const response = await api.post("/LocalizedText", payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create translation."));
  }
};

export const getTranslations = async (): Promise<LocalizedText[]> => {
  try {
    const response = await api.get("/LocalizedText");
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get translations."));
  }
};
