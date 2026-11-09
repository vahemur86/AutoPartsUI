export type HikvisionConnectionStatus = 0 | 1 | 2 | 3 | 4;
export type HikvisionSyncStatus = 0 | 1 | 2 | 3;
export type HikvisionJobType = 0 | 1 | 2 | 3;
export type HikvisionEventStatus = 0 | 1 | 2 | 3 | 4 | 5;

export interface HikvisionDevice {
  id: number;
  name: string;
  host: string;
  port: number;
  protocol: "http" | "https";
  userName: string;
  passwordConfigured: boolean;
  location: string | null;
  description: string | null;
  isEnabled: boolean;
  connectionStatus: HikvisionConnectionStatus;
  lastCheckedAt: string | null;
  lastSuccessfulConnectionAt: string | null;
  lastError: string | null;
  consecutiveFailureCount: number;
}

export interface HikvisionDevicePayload {
  name: string;
  host: string;
  port: number;
  protocol: "http" | "https";
  userName: string;
  password?: string | null;
  location: string;
  description: string;
  isEnabled: boolean;
}

export interface HikvisionTestResult {
  status: HikvisionConnectionStatus;
  hostReachable: boolean;
  error: string | null;
  checkedAt: string;
}

export interface HikvisionEndpoint {
  id: number;
  deviceId: number;
  code: string;
  displayName: string;
  description: string;
  path: string;
  method: string;
  timeoutSeconds: number;
  isEnabled: boolean;
  updatedAt: string | null;
}

export type HikvisionEndpointPayload = Pick<
  HikvisionEndpoint,
  "displayName" | "description" | "path" | "timeoutSeconds" | "isEnabled"
>;

export interface HikvisionSettings {
  deviceId: number;
  employeeSyncEnabled: boolean;
  employeeSyncIntervalMinutes: number;
  attendanceSyncEnabled: boolean;
  attendanceSyncIntervalMinutes: number;
  monitoringIntervalMinutes: number;
  maximumPageSize: number;
  httpTimeoutSeconds: number;
  retryCount: number;
  retryDelaySeconds: number;
  employeeUserType: string;
  faceEventMajorCode: number;
  faceEventMinorCode: number;
  attendanceFinalizationTime: string;
  absenceGracePeriodMinutes: number;
  updatedAt: string | null;
  deviceTimeZoneId: string;
  lastAttendanceSyncAt: string | null;
}

export type HikvisionSettingsPayload = Omit<
  HikvisionSettings,
  "deviceId" | "updatedAt" | "lastAttendanceSyncAt"
>;

export interface HikvisionPerson {
  id: number;
  deviceId: number;
  employeeNo: string;
  name: string;
  userType: string;
  numOfFace: number;
  faceImageUrl: string | null;
  isEmployee: boolean;
  lastSyncedAt: string | null;
  isActive: boolean;
}

export interface HikvisionEmployeeMapping {
  deviceId: number;
  employeeNo: string;
  employeeId: number;
  employeeName: string;
}

export interface HikvisionSync {
  id: number;
  deviceId: number;
  jobType: HikvisionJobType;
  startedAt: string;
  finishedAt: string | null;
  status: HikvisionSyncStatus;
  processedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  errorMessage: string | null;
}

export interface HikvisionProcessedEvent {
  id: number;
  deviceId: number;
  employeeNo: string | null;
  employeeId: number | null;
  majorCode: number;
  minorCode: number;
  eventAtUtc: string;
  processingStatus: HikvisionEventStatus;
  errorMessage: string | null;
  processedAt: string | null;
}
