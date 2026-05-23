import api from "..";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { Tag } from "@/types/settings";

export const getTags = async () => {
  try {
    const response = await api.get("/car-catalyst/birka");
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to get tags."));
  }
};

export const createTag = async (tag: Omit<Tag, "id">) => {
  try {
    const response = await api.post("/car-catalyst/birka", tag);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create tag."));
  }
};

export const updateTag = async (tag: Tag) => {
  try {
    const response = await api.put("/car-catalyst/birka", tag);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update tag."));
  }
};

export const deleteTag = async (id: number) => {
  try {
    const response = await api.delete(`/car-catalyst/birka/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to delete tag."));
  }
};
