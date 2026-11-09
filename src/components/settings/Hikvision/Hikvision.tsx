import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Activity, Camera, Check, Clock3, Pencil, Plus, RefreshCw, Wifi } from "lucide-react";
import { Button, Select, TextField } from "@/ui-kit";
import { getEmployees } from "@/services/settings/workshopPricing";
import {
  createHikvisionDevice,
  getHikvisionDevices,
  getHikvisionEndpoints,
  getHikvisionEvents,
  getHikvisionHistory,
  getHikvisionPersonFace,
  getHikvisionMappings,
  getHikvisionPersons,
  getHikvisionSettings,
  syncHikvision,
  testHikvisionConnection,
  updateHikvisionDevice,
  updateHikvisionEndpoint,
  updateHikvisionSettings,
  putHikvisionMapping,
} from "@/services/hikvision";
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
import type { EmployeeItem } from "@/types/settings";
import styles from "./Hikvision.module.css";

type DeviceTab = "device" | "endpoints" | "settings" | "persons" | "mappings" | "activity";
type ActivityView = "history" | "events";
type DeviceForm = HikvisionDevicePayload;

const blankDeviceForm = (): DeviceForm => ({
  name: "",
  host: "",
  port: 80,
  protocol: "http",
  userName: "",
  password: "",
  location: "",
  description: "",
  isEnabled: true,
});

const customUserTypes = ["custom2", "custom3", "custom4", "custom5"];

const dateTime = (value: string | null | undefined, locale: string) =>
  value ? new Date(value).toLocaleString(locale) : "—";

const localizedError = (
  error: unknown,
  fallbackMessage: string,
  translationKey: string,
  t: TFunction,
) => {
  const message = error instanceof Error ? error.message : "";
  return !message || message === fallbackMessage ? t(translationKey) : message;
};

const isValidHost = (host: string) => {
  if (!host || /[/:?#\s]/.test(host)) return false;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    return host.split(".").every((part) => Number(part) <= 255);
  }
  if (host.includes(":")) return /^[0-9a-f:]+$/i.test(host);
  return /^(?=.{1,253}$)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)(?:\.(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?))*$/i.test(host);
};

const useDeviceFace = (personId: number, enabled: boolean) => {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let objectUrl = "";
    void getHikvisionPersonFace(personId)
      .then((data) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(data);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setUrl("");
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enabled, personId]);
  return url;
};

const PersonFace = ({ person }: { person: HikvisionPerson }) => {
  const { t } = useTranslation();
  const image = useDeviceFace(person.id, Boolean(person.faceImageUrl));
  return image
    ? <img className={styles.face} src={image} alt="" />
    : <span className={styles.facePlaceholder} title={t("hikvision.persons.faceUnavailable")} aria-hidden="true"><Camera size={17} /></span>;
};

const devicePayload = (form: DeviceForm, editing: boolean): DeviceForm => ({
  name: form.name.trim(),
  host: form.host.trim(),
  port: Number(form.port),
  protocol: form.protocol,
  userName: form.userName.trim(),
  password: form.password || (editing ? null : ""),
  location: form.location.trim(),
  description: form.description.trim(),
  isEnabled: form.isEnabled,
});

const validateDeviceForm = (form: DeviceForm, editing: boolean, t: TFunction): string | null => {
  if (!form.name.trim() || !form.userName.trim()) return t("hikvision.form.nameRequired");
  if (!isValidHost(form.host.trim())) return t("hikvision.form.invalidHost");
  const port = Number(form.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return t("hikvision.form.invalidPort");
  if (form.protocol !== "http" && form.protocol !== "https") return t("hikvision.form.invalidProtocol");
  if (!editing && !form.password) return t("hikvision.form.passwordRequired");
  return null;
};

const toSettingsPayload = (settings: HikvisionSettings): HikvisionSettingsPayload => ({
  employeeSyncEnabled: settings.employeeSyncEnabled,
  employeeSyncIntervalMinutes: settings.employeeSyncIntervalMinutes,
  attendanceSyncEnabled: settings.attendanceSyncEnabled,
  attendanceSyncIntervalMinutes: settings.attendanceSyncIntervalMinutes,
  monitoringIntervalMinutes: settings.monitoringIntervalMinutes,
  maximumPageSize: settings.maximumPageSize,
  httpTimeoutSeconds: settings.httpTimeoutSeconds,
  retryCount: settings.retryCount,
  retryDelaySeconds: settings.retryDelaySeconds,
  employeeUserType: settings.employeeUserType,
  faceEventMajorCode: settings.faceEventMajorCode,
  faceEventMinorCode: settings.faceEventMinorCode,
  attendanceFinalizationTime: settings.attendanceFinalizationTime,
  absenceGracePeriodMinutes: settings.absenceGracePeriodMinutes,
  deviceTimeZoneId: settings.deviceTimeZoneId,
});

const validateSettings = (settings: HikvisionSettingsPayload, t: TFunction): string | null => {
  const ranges: Array<[number, number, number, string]> = [
    [settings.employeeSyncIntervalMinutes, 1, 1440, "employeeIntervalError"],
    [settings.attendanceSyncIntervalMinutes, 1, 1440, "attendanceIntervalError"],
    [settings.monitoringIntervalMinutes, 1, 1440, "monitoringIntervalError"],
    [settings.maximumPageSize, 1, 30, "pageSizeError"],
    [settings.httpTimeoutSeconds, 1, 300, "httpTimeoutError"],
    [settings.retryCount, 0, 5, "retryCountError"],
    [settings.retryDelaySeconds, 1, 60, "retryDelayError"],
    [settings.faceEventMajorCode, 0, 65535, "majorCodeError"],
    [settings.faceEventMinorCode, 0, 65535, "minorCodeError"],
    [settings.absenceGracePeriodMinutes, 0, 1440, "gracePeriodError"],
  ];
  for (const [value, min, max, label] of ranges) {
    if (!Number.isInteger(value) || value < min || value > max) {
      return t("hikvision.settings.invalidRange", { field: t(`hikvision.settings.${label}`), min, max });
    }
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(settings.attendanceFinalizationTime)) {
    return t("hikvision.settings.invalidTime");
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: settings.deviceTimeZoneId }).format();
  } catch {
    return t("hikvision.settings.invalidTimeZone");
  }
  return null;
};

const DeviceFormFields = ({
  value,
  onChange,
  editing,
  t,
}: {
  value: DeviceForm;
  onChange: (value: DeviceForm) => void;
  editing: boolean;
  t: TFunction;
}) => (
  <div className={styles.formGrid}>
    <TextField label={t("hikvision.form.name")} value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} required />
    <TextField label={t("hikvision.form.host")} value={value.host} onChange={(event) => onChange({ ...value, host: event.target.value })} placeholder={t("hikvision.form.hostPlaceholder")} required />
    <TextField label={t("hikvision.form.port")} type="number" min={1} max={65535} value={value.port} onChange={(event) => onChange({ ...value, port: Number(event.target.value) })} required />
    <label className={styles.fieldLabel}>{t("hikvision.form.protocol")}
      <select value={value.protocol} onChange={(event) => onChange({ ...value, protocol: event.target.value as "http" | "https" })}>
        <option value="http">http</option><option value="https">https</option>
      </select>
    </label>
    <TextField label={t("hikvision.form.username")} value={value.userName} onChange={(event) => onChange({ ...value, userName: event.target.value })} autoComplete="off" required />
    <TextField label={editing ? t("hikvision.form.newPassword") : t("hikvision.form.password")} type="password" value={value.password ?? ""} onChange={(event) => onChange({ ...value, password: event.target.value })} autoComplete="new-password" required={!editing} />
    <TextField label={t("hikvision.form.location")} value={value.location} onChange={(event) => onChange({ ...value, location: event.target.value })} />
    <TextField label={t("hikvision.form.description")} value={value.description} onChange={(event) => onChange({ ...value, description: event.target.value })} />
    <label className={styles.checkField}><input type="checkbox" checked={value.isEnabled} onChange={(event) => onChange({ ...value, isEnabled: event.target.checked })} /> {t("hikvision.form.enabled")}</label>
  </div>
);

export const Hikvision = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? "en";
  const connectionLabels = [
    t("hikvision.connection.unknown"),
    t("hikvision.connection.online"),
    t("hikvision.connection.offline"),
    t("hikvision.connection.authenticationFailed"),
    t("hikvision.connection.apiError"),
  ];
  const syncLabels = ["running", "succeeded", "partial", "failed"].map((key) => t(`hikvision.sync.statuses.${key}`));
  const jobLabels = ["persons", "employees", "attendance", "monitoring"].map((key) => t(`hikvision.sync.jobs.${key}`));
  const eventLabels = ["presentCreated", "presentUpdated", "manualRecordPreserved", "unmappedEmployee", "ignoredEvent", "invalidEvent"]
    .map((key) => t(`hikvision.events.statuses.${key}`));
  const [devices, setDevices] = useState<HikvisionDevice[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<DeviceTab>("device");
  const [activityView, setActivityView] = useState<ActivityView>("history");
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);
  const [deviceForm, setDeviceForm] = useState<DeviceForm>(blankDeviceForm);
  const [deviceFormOpen, setDeviceFormOpen] = useState(false);
  const [savingDevice, setSavingDevice] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<HikvisionTestResult | null>(null);
  const [syncing, setSyncing] = useState<"persons" | "attendance" | null>(null);
  const [syncResult, setSyncResult] = useState<HikvisionSync | null>(null);
  const [endpoints, setEndpoints] = useState<HikvisionEndpoint[]>([]);
  const [endpointDrafts, setEndpointDrafts] = useState<Record<string, HikvisionEndpointPayload>>({});
  const [savingEndpoint, setSavingEndpoint] = useState<string | null>(null);
  const [settings, setSettings] = useState<HikvisionSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [persons, setPersons] = useState<HikvisionPerson[]>([]);
  const [personSearchInput, setPersonSearchInput] = useState("");
  const [personSearch, setPersonSearch] = useState("");
  const [personType, setPersonType] = useState("");
  const [personSkip, setPersonSkip] = useState(0);
  const [mappings, setMappings] = useState<HikvisionEmployeeMapping[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [mappingSelections, setMappingSelections] = useState<Record<string, number>>({});
  const [savingMapping, setSavingMapping] = useState<string | null>(null);
  const [history, setHistory] = useState<HikvisionSync[]>([]);
  const [events, setEvents] = useState<HikvisionProcessedEvent[]>([]);
  const [eventStatus, setEventStatus] = useState("");
  const [eventSkip, setEventSkip] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedDevice = devices.find((device) => device.id === selectedId) ?? null;

  useEffect(() => {
    setMappingSelections({});
  }, [selectedId]);

  const refreshDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      const result = await getHikvisionDevices();
      setDevices(result);
      setSelectedId((current) => current && result.some((device) => device.id === current)
        ? current
        : result[0]?.id ?? null);
      setError("");
    } catch (requestError) {
      setError(localizedError(requestError, "Failed to fetch Hikvision devices.", "hikvision.errors.fetchDevices", t));
    } finally {
      setLoadingDevices(false);
    }
  }, [t]);

  useEffect(() => { void refreshDevices(); }, [refreshDevices]);

  useEffect(() => {
    if (!selectedId) return;
    let current = true;
    const load = async () => {
      setLoadingData(true);
      setError("");
      try {
        if (tab === "endpoints") {
          const result = await getHikvisionEndpoints(selectedId);
          if (current) {
            setEndpoints(result);
            setEndpointDrafts(Object.fromEntries(result.map((endpoint) => [
              endpoint.code,
              {
                displayName: endpoint.displayName,
                description: endpoint.description,
                path: endpoint.path,
                timeoutSeconds: endpoint.timeoutSeconds,
                isEnabled: endpoint.isEnabled,
              },
            ])));
          }
        } else if (tab === "settings") {
          const result = await getHikvisionSettings(selectedId);
          if (current) setSettings(result);
        } else if (tab === "persons") {
          const result = await getHikvisionPersons({
            deviceId: selectedId,
            ...(personType && personType !== "other" ? { userType: personType } : {}),
            search: personSearch || undefined,
            skip: personSkip,
            take: 100,
          });
          if (current) setPersons(result);
        } else if (tab === "mappings") {
          const [mappingRows, activeEmployees, personRows] = await Promise.all([
            getHikvisionMappings(selectedId),
            getEmployees(false),
            getHikvisionPersons({ deviceId: selectedId, skip: personSkip, take: 500 }),
          ]);
          if (current) {
            setMappings(mappingRows);
            setEmployees(activeEmployees.filter((employee) => employee.isActive));
            setPersons(personRows);
          }
        } else if (tab === "activity") {
          if (activityView === "history") {
            const result = await getHikvisionHistory(selectedId);
            if (current) setHistory([...result].sort((a, b) => b.startedAt.localeCompare(a.startedAt)));
          } else {
            const result = await getHikvisionEvents(selectedId, {
              ...(eventStatus !== "" ? { status: Number(eventStatus) } : {}),
              skip: eventSkip,
              take: 100,
            });
            if (current) setEvents(result);
          }
        }
      } catch (requestError) {
        if (current) setError(localizedError(requestError, "Failed to load Hikvision data.", "hikvision.errors.loadData", t));
      } finally {
        if (current) setLoadingData(false);
      }
    };
    void load();
    return () => { current = false; };
  }, [activityView, eventSkip, eventStatus, personSearch, personSkip, personType, refreshKey, selectedId, tab, t]);

  const openNewDeviceForm = () => {
    setEditingDeviceId(null);
    setDeviceForm(blankDeviceForm());
    setDeviceFormOpen(true);
  };

  const openEditDeviceForm = (device: HikvisionDevice) => {
    setEditingDeviceId(device.id);
    setDeviceForm({
      name: device.name,
      host: device.host,
      port: device.port,
      protocol: device.protocol,
      userName: device.userName,
      password: "",
      location: device.location ?? "",
      description: device.description ?? "",
      isEnabled: device.isEnabled,
    });
    setDeviceFormOpen(true);
  };

  const saveDevice = async () => {
    const validation = validateDeviceForm(deviceForm, editingDeviceId !== null, t);
    if (validation) {
      setError(validation);
      return;
    }
    setSavingDevice(true);
    setError("");
    try {
      const payload = devicePayload(deviceForm, editingDeviceId !== null);
      const result = editingDeviceId
        ? await updateHikvisionDevice(editingDeviceId, payload)
        : await createHikvisionDevice(payload);
      setDevices((current) => editingDeviceId
        ? current.map((device) => device.id === result.id ? result : device)
        : [...current, result]);
      setSelectedId(result.id);
      setDeviceFormOpen(false);
      setDeviceForm(blankDeviceForm());
      toast.success(editingDeviceId ? t("hikvision.form.deviceUpdated") : t("hikvision.form.deviceCreated"));
    } catch (requestError) {
      setError(localizedError(
        requestError,
        editingDeviceId ? "Failed to update Hikvision device." : "Failed to create Hikvision device.",
        "hikvision.errors.saveDevice",
        t,
      ));
    } finally {
      setSavingDevice(false);
    }
  };

  const runConnectionTest = async () => {
    if (!selectedId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testHikvisionConnection(selectedId);
      setTestResult(result);
      await refreshDevices();
    } catch (requestError) {
      setError(localizedError(requestError, "Failed to test Hikvision connection.", "hikvision.errors.testConnection", t));
    } finally {
      setTesting(false);
    }
  };

  const runSync = async (kind: "persons" | "attendance") => {
    if (!selectedId) return;
    setSyncing(kind);
    setSyncResult(null);
    try {
      const result = await syncHikvision(selectedId, kind);
      setSyncResult(result);
      setRefreshKey((value) => value + 1);
      await refreshDevices();
      if (result.status === 1) toast.success(t("hikvision.sync.succeeded", { job: jobLabels[result.jobType] ?? t("hikvision.common.unknown") }));
      else toast.error(`${syncLabels[result.status] ?? t("hikvision.common.unknown")}. ${result.errorMessage ?? ""}`.trim());
    } catch (requestError) {
      setError(localizedError(requestError, `Failed to synchronize Hikvision ${kind}.`, "hikvision.errors.sync", t));
    } finally {
      setSyncing(null);
    }
  };

  const saveEndpoint = async (endpoint: HikvisionEndpoint) => {
    if (!selectedId) return;
    const draft = endpointDrafts[endpoint.code];
    if (!draft || !draft.displayName.trim() || !draft.path.trim() || draft.path.startsWith("//") || /^https?:\/\//i.test(draft.path) || !draft.path.startsWith("/")) {
      setError(t("hikvision.errors.invalidEndpointPath"));
      return;
    }
    if (!Number.isInteger(draft.timeoutSeconds) || draft.timeoutSeconds < 1) {
      setError(t("hikvision.errors.invalidEndpointTimeout"));
      return;
    }
    setSavingEndpoint(endpoint.code);
    setError("");
    try {
      const result = await updateHikvisionEndpoint(selectedId, endpoint.code, draft);
      setEndpoints((current) => current.map((item) => item.code === result.code ? result : item));
      toast.success(t("hikvision.endpoints.saved"));
    } catch (requestError) {
      setError(localizedError(requestError, "Failed to update Hikvision endpoint.", "hikvision.errors.saveEndpoint", t));
    } finally {
      setSavingEndpoint(null);
    }
  };

  const saveSettings = async () => {
    if (!selectedId || !settings) return;
    const payload = toSettingsPayload(settings);
    const validation = validateSettings(payload, t);
    if (validation) {
      setError(validation);
      return;
    }
    setSavingSettings(true);
    setError("");
    try {
      setSettings(await updateHikvisionSettings(selectedId, payload));
      toast.success(t("hikvision.sync.settingsSaved"));
    } catch (requestError) {
      setError(localizedError(requestError, "Failed to update Hikvision settings.", "hikvision.errors.saveSettings", t));
    } finally {
      setSavingSettings(false);
    }
  };

  const searchPersons = () => {
    setPersonSkip(0);
    setPersonSearch(personSearchInput.trim());
  };

  const saveMapping = async (person: HikvisionPerson) => {
    if (!selectedId || person.userType !== "custom1" || !person.isActive) return;
    const employeeId = mappingSelections[person.employeeNo] ?? mappings.find((item) => item.employeeNo === person.employeeNo)?.employeeId;
    if (!employeeId) {
      setError(t("hikvision.errors.selectEmployee"));
      return;
    }
    setSavingMapping(person.employeeNo);
    setError("");
    try {
      await putHikvisionMapping(selectedId, person.employeeNo, employeeId);
      const employee = employees.find((item) => item.id === employeeId);
      setMappings((current) => [
        ...current.filter((item) => item.employeeNo !== person.employeeNo),
        {
          deviceId: selectedId,
          employeeNo: person.employeeNo,
          employeeId,
          employeeName: employee?.fullName ?? "",
        },
      ]);
      toast.success(t("hikvision.mappings.saved"));
    } catch (requestError) {
      setError(localizedError(requestError, "Failed to save Hikvision mapping.", "hikvision.errors.saveMapping", t));
    } finally {
      setSavingMapping(null);
    }
  };

  const showOtherUserTypes = personType === "other";
  const [otherUserType, setOtherUserType] = useState("");
  const shownPersons = useMemo(
    () => showOtherUserTypes
      ? persons.filter((person) => customUserTypes.includes(person.userType) && (!otherUserType || person.userType === otherUserType))
      : persons,
    [otherUserType, persons, showOtherUserTypes],
  );

  const setSettingsValue = <K extends keyof HikvisionSettings>(
    key: K,
    value: HikvisionSettings[K],
  ) => setSettings((current) => current ? { ...current, [key]: value } : current);

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1><Camera size={21} /> {t("hikvision.title")}</h1>
          <p>{t("hikvision.description")}</p>
        </div>
        <Button onClick={openNewDeviceForm}><Plus size={16} /> {t("hikvision.addDevice")}</Button>
      </header>

      {error && <div className={styles.error} role="alert">{error}<button type="button" onClick={() => setError("")}>{t("hikvision.dismiss")}</button></div>}

      {deviceFormOpen && (
        <section className={styles.panel}>
          <h2>{editingDeviceId ? t("hikvision.editDevice") : t("hikvision.addDevice")}</h2>
          <DeviceFormFields value={deviceForm} onChange={setDeviceForm} editing={editingDeviceId !== null} t={t} />
          <div className={styles.actions}>
            <Button onClick={() => void saveDevice()} disabled={savingDevice}>{savingDevice ? t("hikvision.saving") : t("hikvision.saveDevice")}</Button>
            <Button variant="secondary" onClick={() => { setDeviceFormOpen(false); setDeviceForm((current) => ({ ...current, password: "" })); }} disabled={savingDevice}>{t("hikvision.cancel")}</Button>
          </div>
        </section>
      )}

      <div className={styles.layout}>
        <aside className={styles.devicePanel}>
          <div className={styles.panelHeading}>
            <h2>{t("hikvision.devices")}</h2>
            <button type="button" onClick={() => void refreshDevices()} aria-label={t("hikvision.refreshDevices")}><RefreshCw size={15} /></button>
          </div>
          {loadingDevices ? <p>{t("hikvision.loadingDevices")}</p> : devices.length === 0 ? <p>{t("hikvision.noDevices")}</p> : devices.map((device) => (
            <button
              type="button"
              key={device.id}
              className={`${styles.deviceItem} ${selectedId === device.id ? styles.deviceSelected : ""}`}
              onClick={() => { setSelectedId(device.id); setTestResult(null); setSyncResult(null); }}
            >
              <span className={styles.deviceName}>{device.name}</span>
              <span>{device.host}:{device.port}</span>
              <span className={styles.statusLine}><i data-status={device.connectionStatus} />{connectionLabels[device.connectionStatus] ?? t("hikvision.common.unknown")}</span>
            </button>
          ))}
        </aside>

        <section className={styles.contentPanel}>
          {!selectedDevice ? <div className={styles.emptyState}>{t("hikvision.selectDevice")}</div> : (
            <>
              <header className={styles.selectedHeader}>
                <div>
                  <h2>{selectedDevice.name}</h2>
                  <p>{selectedDevice.protocol}://{selectedDevice.host}:{selectedDevice.port} · {selectedDevice.location || t("hikvision.noLocation")}</p>
                </div>
                <div className={styles.actions}>
                  <Button variant="secondary" onClick={() => void runConnectionTest()} disabled={testing}>
                    <Wifi size={15} />{testing ? t("hikvision.testing") : t("hikvision.testConnection")}
                  </Button>
                  <Button variant="secondary" onClick={() => openEditDeviceForm(selectedDevice)}><Pencil size={15} /> {t("hikvision.editDevice")}</Button>
                </div>
              </header>
              <nav className={styles.tabs} aria-label={t("hikvision.deviceConfiguration")}>
                {([
                  ["device", t("hikvision.tabs.device")],
                  ["endpoints", t("hikvision.tabs.endpoints")],
                  ["settings", t("hikvision.tabs.settings")],
                  ["persons", t("hikvision.tabs.persons")],
                  ["mappings", t("hikvision.tabs.mappings")],
                  ["activity", t("hikvision.tabs.activity")],
                ] as Array<[DeviceTab, string]>).map(([key, label]) => (
                  <button type="button" key={key} className={tab === key ? styles.activeTab : ""} onClick={() => { setTab(key); setError(""); }}>
                    {label}
                  </button>
                ))}
              </nav>

              {testResult && (
                <div className={testResult.status === 1 ? styles.successBox : styles.errorBox} role="status">
                  {t("hikvision.connection.test", {
                    status: connectionLabels[testResult.status] ?? t("hikvision.common.unknown"),
                    reachability: t(testResult.hostReachable ? "hikvision.connection.reachable" : "hikvision.connection.unreachable"),
                    date: dateTime(testResult.checkedAt, locale),
                  })}
                  {testResult.error && <p>{testResult.error}</p>}
                </div>
              )}
              {syncResult && (
                <div className={syncResult.status === 1 ? styles.successBox : styles.errorBox} role="status">
                  {t("hikvision.sync.result", {
                    job: jobLabels[syncResult.jobType] ?? t("hikvision.common.unknown"),
                    status: syncLabels[syncResult.status] ?? t("hikvision.common.unknown"),
                    processed: syncResult.processedCount,
                    created: syncResult.createdCount,
                    updated: syncResult.updatedCount,
                    skipped: syncResult.skippedCount,
                    failed: syncResult.failedCount,
                  })}
                  {syncResult.errorMessage && <p>{syncResult.errorMessage}</p>}
                </div>
              )}

              {loadingData && tab !== "device" ? <div className={styles.loading}>{t("hikvision.loading")}</div> : null}
              {tab === "device" && (
                <div className={styles.detailsGrid}>
                  <Info label={t("hikvision.connection.status")} value={connectionLabels[selectedDevice.connectionStatus] ?? t("hikvision.common.unknown")} />
                  <Info label={t("hikvision.connection.lastChecked")} value={dateTime(selectedDevice.lastCheckedAt, locale)} />
                  <Info label={t("hikvision.connection.lastSuccess")} value={dateTime(selectedDevice.lastSuccessfulConnectionAt, locale)} />
                  <Info label={t("hikvision.connection.failureCount")} value={String(selectedDevice.consecutiveFailureCount)} />
                  <Info label={t("hikvision.connection.passwordConfigured")} value={t(selectedDevice.passwordConfigured ? "hikvision.common.yes" : "hikvision.common.no")} />
                  <Info label={t("hikvision.connection.enabled")} value={t(selectedDevice.isEnabled ? "hikvision.common.yes" : "hikvision.common.no")} />
                  <Info label={t("hikvision.connection.lastError")} value={selectedDevice.lastError || t("hikvision.common.none")} wide />
                  <div className={styles.syncActions}>
                    <Button onClick={() => void runSync("persons")} disabled={syncing !== null}>
                      {syncing === "persons" ? t("hikvision.sync.syncingPersons") : t("hikvision.sync.persons")}
                    </Button>
                    <Button onClick={() => void runSync("attendance")} disabled={syncing !== null}>
                      {syncing === "attendance" ? t("hikvision.sync.syncingAttendance") : t("hikvision.sync.attendance")}
                    </Button>
                  </div>
                </div>
              )}

              {tab === "endpoints" && !loadingData && (
                <div className={styles.stack}>
                  {endpoints.map((endpoint) => {
                    const draft = endpointDrafts[endpoint.code];
                    const dynamicFace = endpoint.code === "FaceImageDownload";
                    return <article className={styles.endpointCard} key={endpoint.code}>
                      <div className={styles.endpointHeading}>
                        <div><h3>{endpoint.displayName}</h3><span>{endpoint.code} · {endpoint.method} · {t("hikvision.endpoints.updated", { date: dateTime(endpoint.updatedAt, locale) })}</span></div>
                        <span className={styles.readOnly}>{t("hikvision.endpoints.readOnly", { method: endpoint.method })}</span>
                      </div>
                      <div className={styles.formGrid}>
                        <TextField label={t("hikvision.endpoints.displayName")} value={draft?.displayName ?? ""} onChange={(event) => setEndpointDrafts((current) => ({ ...current, [endpoint.code]: { ...current[endpoint.code], displayName: event.target.value } }))} />
                        <TextField label={t("hikvision.endpoints.timeout")} type="number" min={1} value={draft?.timeoutSeconds ?? 30} onChange={(event) => setEndpointDrafts((current) => ({ ...current, [endpoint.code]: { ...current[endpoint.code], timeoutSeconds: Number(event.target.value) } }))} />
                        <TextField label={t("hikvision.endpoints.path")} value={dynamicFace ? t("hikvision.endpoints.dynamicFace") : draft?.path ?? ""} disabled={dynamicFace} onChange={(event) => setEndpointDrafts((current) => ({ ...current, [endpoint.code]: { ...current[endpoint.code], path: event.target.value } }))} />
                        <TextField label={t("hikvision.endpoints.description")} value={draft?.description ?? ""} onChange={(event) => setEndpointDrafts((current) => ({ ...current, [endpoint.code]: { ...current[endpoint.code], description: event.target.value } }))} />
                        <label className={styles.checkField}><input type="checkbox" checked={draft?.isEnabled ?? endpoint.isEnabled} onChange={(event) => setEndpointDrafts((current) => ({ ...current, [endpoint.code]: { ...current[endpoint.code], isEnabled: event.target.checked } }))} /> {t("hikvision.form.enabled")}</label>
                      </div>
                      <Button onClick={() => void saveEndpoint(endpoint)} disabled={savingEndpoint === endpoint.code || dynamicFace}>
                        {savingEndpoint === endpoint.code ? t("hikvision.endpoints.saving") : t("hikvision.endpoints.save")}
                      </Button>
                    </article>;
                  })}
                </div>
              )}

              {tab === "settings" && !loadingData && settings && (
                <div className={styles.stack}>
                  <div className={styles.formGrid}>
                    <ToggleField label={t("hikvision.settings.employeeSync")} checked={settings.employeeSyncEnabled} onChange={(value) => setSettingsValue("employeeSyncEnabled", value)} />
                    <NumberField label={t("hikvision.settings.employeeInterval")} value={settings.employeeSyncIntervalMinutes} min={1} max={1440} onChange={(value) => setSettingsValue("employeeSyncIntervalMinutes", value)} />
                    <ToggleField label={t("hikvision.settings.attendanceSync")} checked={settings.attendanceSyncEnabled} onChange={(value) => setSettingsValue("attendanceSyncEnabled", value)} />
                    <NumberField label={t("hikvision.settings.attendanceInterval")} value={settings.attendanceSyncIntervalMinutes} min={1} max={1440} onChange={(value) => setSettingsValue("attendanceSyncIntervalMinutes", value)} />
                    <NumberField label={t("hikvision.settings.monitoringInterval")} value={settings.monitoringIntervalMinutes} min={1} max={1440} onChange={(value) => setSettingsValue("monitoringIntervalMinutes", value)} />
                    <NumberField label={t("hikvision.settings.pageSize")} value={settings.maximumPageSize} min={1} max={30} onChange={(value) => setSettingsValue("maximumPageSize", value)} />
                    <NumberField label={t("hikvision.settings.httpTimeout")} value={settings.httpTimeoutSeconds} min={1} max={300} onChange={(value) => setSettingsValue("httpTimeoutSeconds", value)} />
                    <NumberField label={t("hikvision.settings.retryCount")} value={settings.retryCount} min={0} max={5} onChange={(value) => setSettingsValue("retryCount", value)} />
                    <NumberField label={t("hikvision.settings.retryDelay")} value={settings.retryDelaySeconds} min={1} max={60} onChange={(value) => setSettingsValue("retryDelaySeconds", value)} />
                    <TextField label={t("hikvision.settings.employeeUserType")} value={settings.employeeUserType} onChange={(event) => setSettingsValue("employeeUserType", event.target.value)} />
                    <NumberField label={t("hikvision.settings.majorCode")} value={settings.faceEventMajorCode} min={0} max={65535} onChange={(value) => setSettingsValue("faceEventMajorCode", value)} />
                    <NumberField label={t("hikvision.settings.minorCode")} value={settings.faceEventMinorCode} min={0} max={65535} onChange={(value) => setSettingsValue("faceEventMinorCode", value)} />
                    <TextField label={t("hikvision.settings.finalizationTime")} type="time" step={1} value={settings.attendanceFinalizationTime} onChange={(event) => setSettingsValue("attendanceFinalizationTime", event.target.value)} />
                    <NumberField label={t("hikvision.settings.gracePeriod")} value={settings.absenceGracePeriodMinutes} min={0} max={1440} onChange={(value) => setSettingsValue("absenceGracePeriodMinutes", value)} />
                    <TextField label={t("hikvision.settings.timeZone")} value={settings.deviceTimeZoneId} onChange={(event) => setSettingsValue("deviceTimeZoneId", event.target.value)} />
                    <Info label={t("hikvision.sync.lastAttendanceSync")} value={dateTime(settings.lastAttendanceSyncAt, locale)} />
                  </div>
                  <div className={styles.warning}>{t("hikvision.settings.automaticAbsentWarning")}</div>
                  <Button onClick={() => void saveSettings()} disabled={savingSettings}>{savingSettings ? t("hikvision.sync.savingSettings") : t("hikvision.sync.saveSettings")}</Button>
                </div>
              )}

              {tab === "persons" && !loadingData && (
                <div className={styles.stack}>
                  <div className={styles.toolbar}>
                    <TextField label={t("hikvision.persons.search")} value={personSearchInput} onChange={(event) => setPersonSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") searchPersons(); }} />
                    <Select label={t("hikvision.persons.userType")} value={personType} onChange={(event) => { setPersonType(event.target.value); setOtherUserType(""); setPersonSkip(0); }}>
                      <option value="">{t("hikvision.persons.all")}</option><option value="custom1">{t("hikvision.persons.employees")}</option><option value="normal">{t("hikvision.persons.normal")}</option><option value="visitor">{t("hikvision.persons.visitors")}</option><option value="blackList">{t("hikvision.persons.blacklist")}</option><option value="other">{t("hikvision.persons.otherCustom")}</option>
                    </Select>
                    {showOtherUserTypes && <Select label={t("hikvision.persons.userType")} value={otherUserType} onChange={(event) => { setOtherUserType(event.target.value); setPersonSkip(0); }}>
                      <option value="">{t("hikvision.persons.allCustom")}</option>{customUserTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </Select>}
                    <Button onClick={searchPersons}>{t("hikvision.persons.searchButton")}</Button>
                  </div>
                  <div className={styles.tableWrap}><table><thead><tr><th>{t("hikvision.persons.person")}</th><th>{t("hikvision.persons.employeeNo")}</th><th>{t("hikvision.persons.userType")}</th><th>{t("hikvision.persons.face")}</th><th>{t("hikvision.persons.hrClassification")}</th><th>{t("hikvision.persons.active")}</th><th>{t("hikvision.persons.lastSynced")}</th></tr></thead>
                    <tbody>{shownPersons.map((person) => <tr key={person.id}>
                      <td><span className={styles.personCell}><PersonFace person={person} />{person.name}</span></td>
                      <td>{person.employeeNo}</td><td>{person.userType}</td><td>{person.numOfFace}</td>
                      <td>{person.userType === "custom1" && person.isEmployee ? t("hikvision.persons.employee") : t("hikvision.common.none")}</td>
                      <td>{t(person.isActive ? "hikvision.common.yes" : "hikvision.common.no")}</td><td>{dateTime(person.lastSyncedAt, locale)}</td>
                    </tr>)}
                    {shownPersons.length === 0 && <tr><td colSpan={7}>{t("hikvision.persons.noPersons")}</td></tr>}
                    </tbody></table>
                  </div>
                  <div className={styles.pager}>
                    <Button variant="secondary" disabled={personSkip === 0} onClick={() => setPersonSkip((value) => Math.max(0, value - 100))}>{t("hikvision.common.previous")}</Button>
                    <span>{t("hikvision.persons.showing", { from: personSkip + 1, to: personSkip + shownPersons.length })}</span>
                    <Button variant="secondary" disabled={persons.length < 100} onClick={() => setPersonSkip((value) => value + 100)}>{t("hikvision.common.next")}</Button>
                  </div>
                </div>
              )}

              {tab === "mappings" && !loadingData && (
                <div className={styles.tableWrap}><table><thead><tr><th>{t("hikvision.mappings.hikvisionEmployeeNo")}</th><th>{t("hikvision.mappings.hikvisionPerson")}</th><th>{t("hikvision.mappings.activeEmployee")}</th><th>{t("hikvision.mappings.mapping")}</th></tr></thead>
                  <tbody>{persons.map((person) => {
                    const mapping = mappings.find((item) => item.employeeNo === person.employeeNo);
                    return <tr key={person.id}>
                      <td>{person.employeeNo}</td><td>{person.name} <small>({person.userType}{person.isActive ? "" : `, ${t("hikvision.persons.inactive")}`})</small></td>
                      <td>{person.userType === "custom1" && person.isActive ? <Select aria-label={t("hikvision.mappings.employeeAria", { employeeNo: person.employeeNo })} value={String(mappingSelections[person.employeeNo] ?? mapping?.employeeId ?? "")} onChange={(event) => setMappingSelections((current) => ({ ...current, [person.employeeNo]: Number(event.target.value) }))}>
                        <option value="">{t("hikvision.mappings.selectEmployee")}</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName} (#{employee.id})</option>)}
                      </Select> : t("hikvision.mappings.availableOnly")}</td>
                      <td>{person.userType === "custom1" && person.isActive ? <Button size="small" onClick={() => void saveMapping(person)} disabled={savingMapping === person.employeeNo}>{savingMapping === person.employeeNo ? t("hikvision.mappings.saving") : mapping ? t("hikvision.mappings.update") : t("hikvision.mappings.map")}</Button> : t("hikvision.common.none")}</td>
                    </tr>;
                  })}
                  {persons.length === 0 && <tr><td colSpan={4}>{t("hikvision.persons.noPersons")}</td></tr>}
                  </tbody></table>
                </div>
              )}
              {tab === "mappings" && !loadingData && (
                <div className={styles.pager}>
                  <Button variant="secondary" disabled={personSkip === 0} onClick={() => setPersonSkip((value) => Math.max(0, value - 500))}>{t("hikvision.common.previous")}</Button>
                  <span>{t("hikvision.mappings.personCount", { count: persons.length })}</span>
                  <Button variant="secondary" disabled={persons.length < 500} onClick={() => setPersonSkip((value) => value + 500)}>{t("hikvision.common.next")}</Button>
                </div>
              )}

              {tab === "activity" && (
                <div className={styles.stack}>
                  <div className={styles.subTabs} role="tablist">
                    <button type="button" aria-selected={activityView === "history"} onClick={() => setActivityView("history")}><Clock3 size={15} /> {t("hikvision.sync.history")}</button>
                    <button type="button" aria-selected={activityView === "events"} onClick={() => { setActivityView("events"); setEventSkip(0); }}><Activity size={15} /> {t("hikvision.sync.eventResults")}</button>
                  </div>
                  {loadingData ? null : activityView === "history" ? (
                    <div className={styles.tableWrap}><table><thead><tr><th>{t("hikvision.sync.job")}</th><th>{t("hikvision.sync.status")}</th><th>{t("hikvision.sync.started")}</th><th>{t("hikvision.sync.finished")}</th><th>{t("hikvision.sync.processed")}</th><th>{t("hikvision.sync.created")}</th><th>{t("hikvision.sync.updated")}</th><th>{t("hikvision.sync.skipped")}</th><th>{t("hikvision.sync.failed")}</th><th>{t("hikvision.sync.error")}</th></tr></thead>
                      <tbody>{history.map((item) => <tr key={item.id}><td>{jobLabels[item.jobType] ?? t("hikvision.common.unknown")}</td><td><StatusBadge status={syncLabels[item.status] ?? t("hikvision.common.unknown")} /></td><td>{dateTime(item.startedAt, locale)}</td><td>{dateTime(item.finishedAt, locale)}</td><td>{item.processedCount}</td><td>{item.createdCount}</td><td>{item.updatedCount}</td><td>{item.skippedCount}</td><td>{item.failedCount}</td><td>{item.errorMessage || t("hikvision.common.none")}</td></tr>)}
                        {history.length === 0 && <tr><td colSpan={10}>{t("hikvision.sync.noHistory")}</td></tr>}</tbody></table>
                    </div>
                  ) : (
                    <>
                      <div className={styles.toolbar}>
                        <Select label={t("hikvision.events.processingStatus")} value={eventStatus} onChange={(event) => { setEventStatus(event.target.value); setEventSkip(0); }}>
                          <option value="">{t("hikvision.events.all")}</option>{eventLabels.map((label, index) => <option key={label} value={index}>{label}</option>)}
                        </Select>
                      </div>
                      <div className={styles.tableWrap}><table><thead><tr><th>{t("hikvision.events.processingStatus")}</th><th>{t("hikvision.persons.employeeNo")}</th><th>{t("hikvision.events.employeeId")}</th><th>{t("hikvision.events.majorMinor")}</th><th>{t("hikvision.events.eventTime")}</th><th>{t("hikvision.events.processedAt")}</th><th>{t("hikvision.sync.error")}</th></tr></thead>
                        <tbody>{events.map((item) => <tr key={item.id}><td><StatusBadge status={eventLabels[item.processingStatus] ?? t("hikvision.common.unknown")} /></td><td>{item.employeeNo || t("hikvision.common.none")}</td><td>{item.employeeId ?? t("hikvision.common.none")}</td><td>{item.majorCode}/{item.minorCode}</td><td>{dateTime(item.eventAtUtc, locale)}</td><td>{dateTime(item.processedAt, locale)}</td><td>{item.errorMessage || t("hikvision.common.none")}</td></tr>)}
                          {events.length === 0 && <tr><td colSpan={7}>{t("hikvision.events.noEvents")}</td></tr>}</tbody></table>
                      </div>
                      <div className={styles.pager}>
                        <Button variant="secondary" disabled={eventSkip === 0} onClick={() => setEventSkip((value) => Math.max(0, value - 100))}>{t("hikvision.common.previous")}</Button>
                        <span>{t("hikvision.sync.eventCount", { count: events.length })}</span>
                        <Button variant="secondary" disabled={events.length < 100} onClick={() => setEventSkip((value) => value + 100)}>{t("hikvision.common.next")}</Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
};

const Info = ({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) => (
  <div className={`${styles.info} ${wide ? styles.wide : ""}`}><span>{label}</span><strong>{value}</strong></div>
);

const NumberField = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) => <TextField label={label} type="number" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />;

const ToggleField = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => <label className={styles.checkField}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;

const StatusBadge = ({ status }: { status: string }) => (
  <span className={styles.statusBadge}><Check size={12} />{status}</span>
);
