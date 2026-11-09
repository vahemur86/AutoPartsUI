import api from ".";
import { getApiErrorMessage } from "@/utils";
import type {
  HikvisionDevice,
  HikvisionDevicePayload,
  HikvisionEmployeeMapping,
  HikvisionEndpoint,
  HikvisionEndpointPayload,
  HikvisionPerson,
  HikvisionProcessedEvent,
  HikvisionSettings,
  HikvisionSettingsPayload,
  HikvisionSync,
  HikvisionTestResult,
} from "@/types/hikvision";

const base = "/hikvision";

const asArray = <T>(value: unknown, fallback: string): T[] => {
  if (!Array.isArray(value)) throw new Error(fallback);
  return value as T[];
};

export const getHikvisionDevices = async (): Promise<HikvisionDevice[]> => {
  try {
    const response = await api.get(`${base}/devices`);
    return asArray<HikvisionDevice>(response.data, "Invalid Hikvision devices response.");
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch Hikvision devices."));
  }
};

export const createHikvisionDevice = async (
  payload: HikvisionDevicePayload,
): Promise<HikvisionDevice> => {
  try {
    const response = await api.post(`${base}/devices`, payload);
    return response.data as HikvisionDevice;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to create Hikvision device."));
  }
};

export const updateHikvisionDevice = async (
  deviceId: number,
  payload: HikvisionDevicePayload,
): Promise<HikvisionDevice> => {
  try {
    const response = await api.put(`${base}/devices/${deviceId}`, payload);
    return response.data as HikvisionDevice;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update Hikvision device."));
  }
};

export const testHikvisionConnection = async (
  deviceId: number,
): Promise<HikvisionTestResult> => {
  try {
    const response = await api.post(`${base}/devices/${deviceId}/test-connection`);
    return response.data as HikvisionTestResult;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to test Hikvision connection."));
  }
};

export const getHikvisionEndpoints = async (
  deviceId: number,
): Promise<HikvisionEndpoint[]> => {
  try {
    const response = await api.get(`${base}/devices/${deviceId}/endpoints`);
    return asArray<HikvisionEndpoint>(response.data, "Invalid Hikvision endpoints response.");
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch Hikvision endpoints."));
  }
};

export const updateHikvisionEndpoint = async (
  deviceId: number,
  code: string,
  payload: HikvisionEndpointPayload,
): Promise<HikvisionEndpoint> => {
  try {
    const response = await api.put(
      `${base}/devices/${deviceId}/endpoints/${encodeURIComponent(code)}`,
      payload,
    );
    return response.data as HikvisionEndpoint;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update Hikvision endpoint."));
  }
};

export const getHikvisionSettings = async (
  deviceId: number,
): Promise<HikvisionSettings> => {
  try {
    const response = await api.get(`${base}/devices/${deviceId}/settings`);
    return response.data as HikvisionSettings;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch Hikvision settings."));
  }
};

export const updateHikvisionSettings = async (
  deviceId: number,
  payload: HikvisionSettingsPayload,
): Promise<HikvisionSettings> => {
  try {
    const response = await api.put(`${base}/devices/${deviceId}/settings`, payload);
    return response.data as HikvisionSettings;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to update Hikvision settings."));
  }
};

export const getHikvisionPersons = async (
  params: {
    deviceId: number;
    userType?: string;
    search?: string;
    skip: number;
    take: number;
  },
): Promise<HikvisionPerson[]> => {
  try {
    const { deviceId, ...query } = params;
    const response = await api.get(`${base}/persons`, {
      params: { deviceId, ...query },
    });
    return asArray<HikvisionPerson>(response.data, "Invalid Hikvision persons response.");
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch Hikvision persons."));
  }
};

export const getHikvisionPersonFace = async (personId: number): Promise<Blob> => {
  try {
    const response = await api.get(`${base}/persons/${personId}/face`, {
      responseType: "blob",
    });
    return response.data as Blob;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch face image."));
  }
};

export const getHikvisionMappings = async (
  deviceId: number,
): Promise<HikvisionEmployeeMapping[]> => {
  try {
    const response = await api.get(`${base}/devices/${deviceId}/mappings`);
    return asArray<HikvisionEmployeeMapping>(response.data, "Invalid Hikvision mappings response.");
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch Hikvision mappings."));
  }
};

export const putHikvisionMapping = async (
  deviceId: number,
  employeeNo: string,
  employeeId: number,
): Promise<void> => {
  try {
    await api.put(`${base}/devices/${deviceId}/mappings`, { employeeNo, employeeId });
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to save Hikvision mapping."));
  }
};

export const syncHikvision = async (
  deviceId: number,
  kind: "persons" | "attendance",
): Promise<HikvisionSync> => {
  try {
    const response = await api.post(`${base}/devices/${deviceId}/sync/${kind}`);
    return response.data as HikvisionSync;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, `Failed to synchronize Hikvision ${kind}.`));
  }
};

export const getHikvisionHistory = async (
  deviceId: number,
  take = 100,
): Promise<HikvisionSync[]> => {
  try {
    const response = await api.get(`${base}/devices/${deviceId}/history`, {
      params: { take },
    });
    return asArray<HikvisionSync>(response.data, "Invalid Hikvision history response.");
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch Hikvision history."));
  }
};

export const getHikvisionEvents = async (
  deviceId: number,
  params: { status?: number; skip: number; take: number },
): Promise<HikvisionProcessedEvent[]> => {
  try {
    const response = await api.get(`${base}/devices/${deviceId}/events`, { params });
    return asArray<HikvisionProcessedEvent>(response.data, "Invalid Hikvision event response.");
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch Hikvision events."));
  }
};
