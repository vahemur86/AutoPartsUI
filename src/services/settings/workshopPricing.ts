import api from "..";

import { getApiErrorMessage, getHeaders } from "@/utils";
import type {
  EmployeeCreatePayload,
  EmployeeItem,
  EmployeeUpdatePayload,
  ServiceCreatePayload,
  ServiceCatalogItem,
  ServiceCategoryCreatePayload,
  ServiceCategoryItem,
  ServiceCategoryUpdatePayload,
  ServiceUpdatePayload,
  VehicleServiceTemplateCreatePayload,
  VehicleServiceTemplateItem,
  VehicleServiceTemplateUpdatePayload,
} from "@/types/settings";

const serviceCategoryBase = "/ServiceCategory";
const employeeBase = "/Employee";
const serviceBase = "/Service";
const vehicleTemplateBase = "/VehicleServiceTemplate";

// Service Categories
export const getServiceCategories = async (): Promise<ServiceCategoryItem[]> => {
  try {
    const response = await api.get(serviceCategoryBase);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch service categories."),
    );
  }
};

export const getServiceCategoryById = async (
  id: number,
): Promise<ServiceCategoryItem> => {
  try {
    const response = await api.get(`${serviceCategoryBase}/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch service category."),
    );
  }
};

export const createServiceCategory = async (
  payload: ServiceCategoryCreatePayload,
): Promise<ServiceCategoryItem> => {
  try {
    const response = await api.post(serviceCategoryBase, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create service category."),
    );
  }
};

export const updateServiceCategory = async (
  payload: ServiceCategoryUpdatePayload,
): Promise<ServiceCategoryItem> => {
  try {
    const response = await api.put(serviceCategoryBase, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update service category."),
    );
  }
};

export const activateServiceCategory = async (id: number): Promise<void> => {
  try {
    await api.post(`${serviceCategoryBase}/${id}/activate`);
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to activate service category."),
    );
  }
};

export const deactivateServiceCategory = async (id: number): Promise<void> => {
  try {
    await api.post(`${serviceCategoryBase}/${id}/deactivate`);
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to deactivate service category."),
    );
  }
};

// Employees
export const getEmployees = async (): Promise<EmployeeItem[]> => {
  try {
    const response = await api.get(employeeBase);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch employees."));
  }
};

export const getEmployeeById = async (id: number): Promise<EmployeeItem> => {
  try {
    const response = await api.get(`${employeeBase}/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch employee."));
  }
};

export const getEmployeesByCategory = async (
  categoryId: number,
): Promise<EmployeeItem[]> => {
  try {
    const response = await api.get(`${employeeBase}/category/${categoryId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch employees by category."),
    );
  }
};

export const createEmployee = async (
  payload: EmployeeCreatePayload,
): Promise<EmployeeItem> => {
  try {
    const response = await api.post(employeeBase, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create employee."));
  }
};

export const updateEmployee = async (
  payload: EmployeeUpdatePayload,
): Promise<EmployeeItem> => {
  try {
    const response = await api.put(employeeBase, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update employee."));
  }
};

export const activateEmployee = async (id: number): Promise<void> => {
  try {
    await api.post(`${employeeBase}/${id}/activate`);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to activate employee."));
  }
};

export const deactivateEmployee = async (id: number): Promise<void> => {
  try {
    await api.post(`${employeeBase}/${id}/deactivate`);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to deactivate employee."));
  }
};

// Services
export const getServices = async (): Promise<ServiceCatalogItem[]> => {
  try {
    const response = await api.get(serviceBase);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch services."));
  }
};

export const getServiceById = async (id: number): Promise<ServiceCatalogItem> => {
  try {
    const response = await api.get(`${serviceBase}/${id}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch service."));
  }
};

export const getServicesByCategory = async (
  categoryId: number,
): Promise<ServiceCatalogItem[]> => {
  try {
    const response = await api.get(`${serviceBase}/category/${categoryId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch services by category."),
    );
  }
};

export const createService = async (
  payload: ServiceCreatePayload,
): Promise<ServiceCatalogItem> => {
  try {
    const response = await api.post(serviceBase, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create service."));
  }
};

export const updateService = async (
  payload: ServiceUpdatePayload,
): Promise<ServiceCatalogItem> => {
  try {
    const response = await api.put(serviceBase, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update service."));
  }
};

export const updateServiceInternalCost = async (
  id: number,
  internalCost: number,
): Promise<ServiceCatalogItem> => {
  try {
    const response = await api.patch(`${serviceBase}/${id}/internal-cost`, {
      internalCost,
    });
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update service internal cost."),
    );
  }
};

export const activateService = async (id: number): Promise<void> => {
  try {
    await api.post(`${serviceBase}/${id}/activate`);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to activate service."));
  }
};

export const deactivateService = async (id: number): Promise<void> => {
  try {
    await api.post(`${serviceBase}/${id}/deactivate`);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to deactivate service."));
  }
};

// Vehicle Service Templates
export const getVehicleServiceTemplates = async (
  cashRegisterId?: number,
): Promise<VehicleServiceTemplateItem[]> => {
  try {
    const response = await api.get(vehicleTemplateBase, {
      headers: getHeaders(cashRegisterId),
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch vehicle service templates."),
    );
  }
};

export const createVehicleServiceTemplate = async (
  payload: VehicleServiceTemplateCreatePayload,
): Promise<VehicleServiceTemplateItem> => {
  try {
    const response = await api.post(vehicleTemplateBase, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to create vehicle service template."),
    );
  }
};

export const updateVehicleServiceTemplate = async (
  payload: VehicleServiceTemplateUpdatePayload,
): Promise<VehicleServiceTemplateItem> => {
  try {
    const response = await api.put(vehicleTemplateBase, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to update vehicle service template."),
    );
  }
};
