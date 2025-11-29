import api from ".";

export const createProduct = async (
  code: string,
  sku: string,
  brandId: number,
  categoryId: number,
  unitTypeId: number,
  boxSizeId: number,
  vehicleDependent: boolean
) => {
  try {
    const response = await api.post(`/Products`, {
      code,
      sku,
      brandId,
      categoryId,
      unitTypeId,
      boxSizeId,
      vehicleDependent,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to create product.");
  }
};

export const getProducts = async () => {
  try {
    const response = await api.get(`/Products`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to get products.");
  }
};

export const deleteProduct = async (id: number) => {
  try {
    const response = await api.delete(`/Products/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || "Failed to delete products."
    );
  }
};

export const updateProduct = async (
  id: number,
  code: string,
  sku: string,
  brandId: number,
  categoryId: number,
  unitTypeId: number,
  boxSizeId: number,
  vehicleDependent: boolean
) => {
  try {
    const response = await api.put(`/Products`, {
      id,
      code,
      sku,
      brandId,
      categoryId,
      unitTypeId,
      boxSizeId,
      vehicleDependent,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || "Failed to update products."
    );
  }
};
