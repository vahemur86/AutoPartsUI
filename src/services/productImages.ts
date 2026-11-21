import api from "@/services";
import { getApiErrorMessage } from "@/utils";
import type { AxiosProgressEvent } from "axios";

const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PRODUCT_IMAGE_CHANGED_EVENT = "product:image-changed";

const notifyProductImageChanged = (productId: number) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PRODUCT_IMAGE_CHANGED_EVENT, {
      detail: { productId },
    }));
  }
};

export type ProductImageValidationError = "unsupported-type" | "file-too-large";

export const getProductImageErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (
    error
    && typeof error === "object"
    && "isAxiosError" in error
    && (error as { isAxiosError?: boolean }).isAxiosError
    && !("response" in error && (error as { response?: unknown }).response)
  ) {
    return fallback;
  }
  return getApiErrorMessage(error, fallback);
};

export const validateProductImage = (
  file: File,
): ProductImageValidationError | null => {
  if (!PRODUCT_IMAGE_TYPES.has(file.type)) return "unsupported-type";
  if (file.size > MAX_PRODUCT_IMAGE_SIZE) return "file-too-large";
  return null;
};

const imageForm = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return form;
};

export const uploadProductImage = async (
  productId: number,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> => {
  await api.post(
    `/products/${productId}/image`,
    imageForm(file),
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    },
  );
  notifyProductImageChanged(productId);
};

export const replaceProductImage = uploadProductImage;

export const getProductImage = async (productId: number): Promise<Blob> => {
  const response = await api.get<Blob>(`/products/${productId}/image`, {
    responseType: "blob",
  });
  return response.data;
};

export const deleteProductImage = async (productId: number): Promise<void> => {
  await api.delete(`/products/${productId}/image`);
  notifyProductImageChanged(productId);
};

export const productImageChangedEvent = PRODUCT_IMAGE_CHANGED_EVENT;
