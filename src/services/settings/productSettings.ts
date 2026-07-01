import api from "..";
import i18n from "@/i18n/config";

import type {
  CategoriesTreeResponse,
  CategoryNode,
  CreateCategoryPayload,
  ProductSettingItem,
  UpdateCategoryPayload,
} from "@/types/settings";

// utils
import { getApiErrorMessage, getHeaders } from "@/utils";
import { mapI18nCodeToApiCode } from "@/utils/languageMapping";

// Generic CRUD factory
export const createCrudService = (endpoint: string, entityName: string) => {
  return {
    create: async (code: string) => {
      try {
        const response = await api.post(`/${endpoint}`, { code });
        return response.data;
      } catch (error: unknown) {
        throw new Error(
          getApiErrorMessage(error, `Failed to create ${entityName}.`),
        );
      }
    },

    getAll: async (cashRegisterId?: number) => {
      try {
        const response = await api.get(`/${endpoint}`, {
          headers: getHeaders(cashRegisterId),
        });
        return response.data;
      } catch (error: unknown) {
        throw new Error(
          getApiErrorMessage(error, `Failed to get ${entityName}.`),
        );
      }
    },

    delete: async (id: number) => {
      try {
        const response = await api.delete(`/${endpoint}/${id}`);
        return response.data;
      } catch (error: unknown) {
        throw new Error(
          getApiErrorMessage(error, `Failed to delete ${entityName}.`),
        );
      }
    },

    update: async (id: number, code: string) => {
      try {
        const response = await api.put(`/${endpoint}`, { id, code });
        return response.data;
      } catch (error: unknown) {
        throw new Error(
          getApiErrorMessage(error, `Failed to update ${entityName}.`),
        );
      }
    },
  };
};

const getCurrentApiLanguageCode = () => {
  return mapI18nCodeToApiCode(i18n.language || "en");
};

const normalizeCategoryNode = (rawNode: unknown): CategoryNode | null => {
  if (!rawNode || typeof rawNode !== "object") return null;

  const node = rawNode as Record<string, unknown>;
  const id = Number(node.id ?? 0);
  if (!id) return null;

  const rawChildren = Array.isArray(node.subCategories)
    ? node.subCategories
    : Array.isArray(node.subcategories)
      ? node.subcategories
      : Array.isArray(node.children)
        ? node.children
        : [];

  const subCategories = rawChildren
    .map((child) => normalizeCategoryNode(child))
    .filter((child): child is CategoryNode => !!child);

  return {
    id,
    code: String(node.code ?? ""),
    name:
      node.name != null && String(node.name).trim()
        ? String(node.name)
        : undefined,
    parentCategoryId:
      node.parentCategoryId != null ? Number(node.parentCategoryId) : null,
    parentName:
      node.parentName != null && String(node.parentName).trim()
        ? String(node.parentName)
        : null,
    level: Number(node.level ?? 0),
    isActive: node.isActive !== false,
    displayOrder: Number(node.displayOrder ?? 0),
    canHaveProducts:
      node.canHaveProducts != null ? Boolean(node.canHaveProducts) : undefined,
    subCategories,
  };
};

export const categoryService = {
  create: async (payload: CreateCategoryPayload) => {
    try {
      const response = await api.post("/Categories", payload);
      return response.data;
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, "Failed to create category."));
    }
  },

  getAll: async (): Promise<ProductSettingItem[]> => {
    try {
      const response = await api.get("/Categories/with-names", {
        params: {
          languageCode: getCurrentApiLanguageCode(),
        },
      });

      const items = Array.isArray(response.data) ? response.data : [];
      return items.map((item: ProductSettingItem) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        parentCategoryId: item.parentCategoryId ?? null,
        level: item.level,
        isActive: item.isActive,
        displayOrder: item.displayOrder,
        canHaveProducts: item.canHaveProducts,
        enabled: item.isActive,
      }));
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, "Failed to get category."));
    }
  },

  getTree: async (cashRegisterId?: number): Promise<CategoriesTreeResponse> => {
    try {
      const response = await api.get("/Categories/tree", {
        headers: getHeaders(cashRegisterId),
        params: {
          languageCode: getCurrentApiLanguageCode(),
        },
      });

      const data = response.data as Partial<CategoriesTreeResponse>;

      const rootCategories = (Array.isArray(data?.rootCategories)
        ? data.rootCategories
        : [])
        .map((node) => normalizeCategoryNode(node))
        .filter((node): node is CategoryNode => !!node);

      return {
        rootCategories,
      };
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, "Failed to get category tree."));
    }
  },

  delete: async (id: number) => {
    try {
      const response = await api.delete(`/Categories/${id}`);
      return response.data;
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, "Failed to delete category."));
    }
  },

  update: async (payload: UpdateCategoryPayload): Promise<CategoryNode> => {
    try {
      const response = await api.put("/Categories", payload);
      return response.data;
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, "Failed to update category."));
    }
  },
};

// Export individual services
export const brandsService = createCrudService("Brands", "brands");
export const unitTypeService = createCrudService("UnitType", "unitType");
export const boxSizeService = createCrudService("BoxSize", "boxSize");

// Export category functions
export const getCategories = () => categoryService.getAll();
export const getCategoriesTree = (cashRegisterId?: number) =>
  categoryService.getTree(cashRegisterId);
export const createCategoryNode = (payload: CreateCategoryPayload) =>
  categoryService.create(payload);
export const updateCategoryNode = (payload: UpdateCategoryPayload) =>
  categoryService.update(payload);
export const deleteCategory = (id: number) => categoryService.delete(id);

// Backward-compatible wrappers used by generic settings flows
export const createCategory = (code: string) =>
  categoryService.create({
    code,
    parentCategoryId: null,
    displayOrder: 1,
  });

export const updateCategory = (id: number, code: string) =>
  categoryService.update({
    id,
    code,
    parentCategoryId: null,
    isActive: true,
    displayOrder: 1,
  });

export const {
  create: createBrands,
  getAll: getBrands,
  delete: deleteBrands,
  update: updateBrands,
} = brandsService;

export const {
  create: createUnitType,
  getAll: getUnitTypes,
  delete: deleteUnitType,
  update: updateUnitType,
} = unitTypeService;

export const {
  create: createBoxSize,
  getAll: getBoxSizes,
  delete: deleteBoxSize,
  update: updateBoxSize,
} = boxSizeService;
