import api from "..";

// Generic CRUD factory
export const createCrudService = (endpoint: string, entityName: string) => {
  return {
    create: async (code: string) => {
      try {
        const response = await api.post(`/${endpoint}`, { code });
        return response.data;
      } catch (error: any) {
        throw new Error(
          error.response?.data?.error || `Failed to create ${entityName}.`
        );
      }
    },

    getAll: async () => {
      try {
        const response = await api.get(`/${endpoint}`);
        return response.data;
      } catch (error: any) {
        throw new Error(
          error.response?.data?.error || `Failed to get ${entityName}.`
        );
      }
    },

    delete: async (id: number) => {
      try {
        const response = await api.delete(`/${endpoint}/${id}`);
        return response.data;
      } catch (error: any) {
        throw new Error(
          error.response?.data?.error || `Failed to delete ${entityName}.`
        );
      }
    },

    update: async (id: number, code: string) => {
      try {
        const response = await api.put(`/${endpoint}`, { id, code });
        return response.data;
      } catch (error: any) {
        throw new Error(
          error.response?.data?.error || `Failed to update ${entityName}.`
        );
      }
    },
  };
};

// Export individual services
export const categoryService = createCrudService("Category", "category");
export const brandsService = createCrudService("Brands", "brands");
export const unitTypeService = createCrudService("UnitType", "unitType");
export const boxSizeService = createCrudService("BoxSize", "boxSize");

// Export backward-compatible named functions
export const {
  create: createCategory,
  getAll: getCategories,
  delete: deleteCategory,
  update: updateCategory,
} = categoryService;

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
