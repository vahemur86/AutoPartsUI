import api from "..";

import { getApiErrorMessage, getHeaders } from "@/utils";
import type {
  EmployeeAttendanceItem,
  EmployeeAttendancePayload,
  EmployeeDepositsAllParams,
  EmployeeDepositItem,
  EmployeeDepositPayload,
  EmployeesOnDutyParams,
  EmployeeCreatePayload,
  EmployeeItem,
  EmployeeSalaryCalculatePayload,
  EmployeeSalaryRecordItem,
  EmployeeServicePercentageItem,
  EmployeeServicePercentagePayload,
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

const salaryTypeToApi = (salaryType: unknown): number => {
  if (salaryType === 1 || salaryType === "1" || salaryType === "PercentageBased") {
    return 1;
  }
  return 0;
};

const salaryTypeFromApi = (salaryType: unknown): "FixedDaily" | "PercentageBased" => {
  if (salaryType === 1 || salaryType === "1" || salaryType === "PercentageBased") {
    return "PercentageBased";
  }
  return "FixedDaily";
};

const normalizeEmployeeSalaryType = (employee: EmployeeItem): EmployeeItem => ({
  ...employee,
  salaryType: salaryTypeFromApi((employee as unknown as Record<string, unknown>).salaryType),
});

const normalizeSalaryRecordSalaryType = (
  record: EmployeeSalaryRecordItem,
): EmployeeSalaryRecordItem => ({
  ...record,
  salaryType: salaryTypeFromApi((record as unknown as Record<string, unknown>).salaryType),
});

const attendanceStatusToApi = (status: unknown): number => {
  if (status === 1 || status === "1" || status === "Present") {
    return 1;
  }
  return 0;
};

const attendanceStatusFromApi = (status: unknown): "Present" | "Absent" => {
  if (status === 1 || status === "1" || status === "Present") {
    return "Present";
  }
  return "Absent";
};

const normalizeAttendanceStatus = (
  attendance: EmployeeAttendanceItem,
): EmployeeAttendanceItem => ({
  ...attendance,
  status: attendanceStatusFromApi(
    (attendance as unknown as Record<string, unknown>).status,
  ),
});

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
export const getEmployees = async (
  includeInactive = false,
): Promise<EmployeeItem[]> => {
  try {
    const response = await api.get(employeeBase, {
      params: { includeInactive },
    });
    return Array.isArray(response.data)
      ? response.data.map((item: EmployeeItem) => normalizeEmployeeSalaryType(item))
      : [];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch employees."));
  }
};

export const getEmployeeById = async (id: number): Promise<EmployeeItem> => {
  try {
    const response = await api.get(`${employeeBase}/${id}`);
    return normalizeEmployeeSalaryType(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch employee."));
  }
};

export const getEmployeesByCategory = async (
  categoryId: number,
  includeInactive = false,
): Promise<EmployeeItem[]> => {
  try {
    const response = await api.get(`${employeeBase}/category/${categoryId}`, {
      params: { includeInactive },
    });
    return Array.isArray(response.data)
      ? response.data.map((item: EmployeeItem) => normalizeEmployeeSalaryType(item))
      : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch employees by category."),
    );
  }
};

export const getEmployeesByShop = async (
  shopId: number,
  includeInactive = false,
): Promise<EmployeeItem[]> => {
  try {
    const response = await api.get(`${employeeBase}/shop/${shopId}`, {
      params: { includeInactive },
    });
    return Array.isArray(response.data)
      ? response.data.map((item: EmployeeItem) => normalizeEmployeeSalaryType(item))
      : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch employees by shop."),
    );
  }
};

export const createEmployee = async (
  payload: EmployeeCreatePayload,
): Promise<EmployeeItem> => {
  try {
    const response = await api.post(employeeBase, {
      ...payload,
      salaryType: salaryTypeToApi(payload.salaryType),
    });
    return normalizeEmployeeSalaryType(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create employee."));
  }
};

export const updateEmployee = async (
  payload: EmployeeUpdatePayload,
): Promise<EmployeeItem> => {
  try {
    const response = await api.put(employeeBase, {
      ...payload,
      salaryType: salaryTypeToApi(payload.salaryType),
    });
    return normalizeEmployeeSalaryType(response.data);
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

export const upsertEmployeeServicePercentage = async (
  payload: EmployeeServicePercentagePayload,
): Promise<EmployeeServicePercentageItem> => {
  try {
    const response = await api.post(`${employeeBase}/service-percentages`, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to upsert employee service percentage."),
    );
  }
};

export const getEmployeeServicePercentages = async (
  employeeId: number,
): Promise<EmployeeServicePercentageItem[]> => {
  try {
    const response = await api.get(`${employeeBase}/${employeeId}/service-percentages`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch employee service percentages."),
    );
  }
};

export const getEmployeeServicePercentagesByService = async (
  serviceId: number,
): Promise<EmployeeServicePercentageItem[]> => {
  try {
    const response = await api.get(
      `${employeeBase}/service-percentages/by-service/${serviceId}`,
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: unknown) {
    throw new Error(
      getApiErrorMessage(error, "Failed to fetch service employee percentages."),
    );
  }
};

export const createEmployeeDeposit = async (
  payload: EmployeeDepositPayload,
): Promise<EmployeeDepositItem> => {
  try {
    const response = await api.post(`${employeeBase}/deposits`, payload);
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create employee deposit."));
  }
};

export const getEmployeeDeposits = async (
  employeeId: number,
): Promise<EmployeeDepositItem[]> => {
  try {
    const response = await api.get(`${employeeBase}/${employeeId}/deposits`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch employee deposits."));
  }
};

export const getEmployeeActiveDeposit = async (
  employeeId: number,
): Promise<EmployeeDepositItem | null> => {
  try {
    const response = await api.get(`${employeeBase}/${employeeId}/deposits/active`);
    return response.data ?? null;
  } catch (error: unknown) {
    return null;
  }
};

export const getAllEmployeeDeposits = async (
  params: EmployeeDepositsAllParams = {},
): Promise<EmployeeDepositItem[]> => {
  try {
    const response = await api.get(`${employeeBase}/deposits/all`, {
      params: {
        ...(params.shopId && params.shopId > 0 ? { shopId: params.shopId } : {}),
        ...(params.activeOnly ? { activeOnly: true } : {}),
      },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch all employee deposits."));
  }
};

export const getEmployeesOnDuty = async (
  params: EmployeesOnDutyParams,
): Promise<EmployeeItem[]> => {
  try {
    const response = await api.get(`${employeeBase}/on-duty`, {
      params: {
        shopId: Number(params.shopId),
        serviceCategoryId: Number(params.serviceCategoryId),
        ...(params.date ? { date: params.date.includes("T") ? params.date.split("T")[0] : params.date } : {}),
      },
    });
    return Array.isArray(response.data)
      ? response.data.map((item: EmployeeItem) => normalizeEmployeeSalaryType(item))
      : [];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch employees on duty."));
  }
};

export const upsertEmployeeAttendance = async (
  payload: EmployeeAttendancePayload,
): Promise<EmployeeAttendanceItem> => {
  try {
    const response = await api.post(`${employeeBase}/attendance`, {
      ...payload,
      status: attendanceStatusToApi(payload.status),
      workDate:
        payload.workDate.includes("T")
          ? payload.workDate
          : `${payload.workDate}T00:00:00Z`,
    });
    return normalizeAttendanceStatus(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to mark attendance."));
  }
};

export const getAttendanceByDate = async (
  date: string,
  shopId?: number,
): Promise<EmployeeAttendanceItem[]> => {
  try {
    const response = await api.get(`${employeeBase}/attendance/by-date`, {
      params: {
        date,
        ...(shopId && shopId > 0 ? { shopId } : {}),
      },
    });
    return Array.isArray(response.data)
      ? response.data.map((item: EmployeeAttendanceItem) => normalizeAttendanceStatus(item))
      : [];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch attendance by date."));
  }
};

export const getEmployeeAttendanceHistory = async (
  employeeId: number,
  params: { from: string; to: string },
): Promise<EmployeeAttendanceItem[]> => {
  try {
    const response = await api.get(`${employeeBase}/${employeeId}/attendance`, {
      params,
    });
    return Array.isArray(response.data)
      ? response.data.map((item: EmployeeAttendanceItem) => normalizeAttendanceStatus(item))
      : [];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch employee attendance history."));
  }
};

export const calculateEmployeeSalary = async (
  payload: EmployeeSalaryCalculatePayload,
): Promise<EmployeeSalaryRecordItem[]> => {
  try {
    const response = await api.post(`${employeeBase}/salary/calculate`, {
      workDate: payload.workDate.includes("T")
        ? payload.workDate.split("T")[0]
        : payload.workDate,
      shopId: Number(payload.shopId ?? 0),
      ...(payload.employeeId && payload.employeeId > 0
        ? { employeeId: Number(payload.employeeId) }
        : {}),
    });
    return Array.isArray(response.data)
      ? response.data.map((item: EmployeeSalaryRecordItem) => normalizeSalaryRecordSalaryType(item))
      : [];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to calculate employee salary."));
  }
};

export const getEmployeeSalaryHistory = async (
  employeeId: number,
  params: { from: string; to: string },
): Promise<EmployeeSalaryRecordItem[]> => {
  try {
    const normalizedParams = {
      from: params.from.includes("T") ? params.from.split("T")[0] : params.from,
      to: params.to.includes("T") ? params.to.split("T")[0] : params.to,
    };
    const response = await api.get(`${employeeBase}/${employeeId}/salary/history`, {
      params: normalizedParams,
    });
    return Array.isArray(response.data)
      ? response.data.map((item: EmployeeSalaryRecordItem) => normalizeSalaryRecordSalaryType(item))
      : [];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch employee salary history."));
  }
};

export const getSalaryByDate = async (
  date: string,
): Promise<EmployeeSalaryRecordItem[]> => {
  try {
    const response = await api.get(`${employeeBase}/salary/by-date`, {
      params: { date },
    });
    return Array.isArray(response.data)
      ? response.data.map((item: EmployeeSalaryRecordItem) => normalizeSalaryRecordSalaryType(item))
      : [];
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch salary by date."));
  }
};

export const markEmployeeSalaryAsPaid = async (
  salaryRecordId: number,
): Promise<EmployeeSalaryRecordItem> => {
  try {
    const response = await api.post(`${employeeBase}/salary/${salaryRecordId}/mark-paid`);
    return normalizeSalaryRecordSalaryType(response.data);
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to mark salary as paid."));
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
