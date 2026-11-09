import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Activity, Check, Clock3, Gem, RefreshCw, Save, Settings2 } from "lucide-react";
import { Button, TextField } from "@/ui-kit";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setKitcoQuota } from "@/store/slices/metalPricesSlice";
import {
  getKitcoSettings,
  getKitcoStatus,
  kitcoQuotaFromStatus,
  testKitcoConnection,
  updateKitcoSettings,
} from "@/services/kitco";
import {
  KitcoApiError,
  type KitcoAvailabilityStatus,
  type KitcoSettings,
  type KitcoSettingsFieldErrors,
  type KitcoSettingsPayload,
  type KitcoStatus,
} from "@/types/kitco";
import styles from "./Kitco.module.css";

const statusClass: Record<KitcoAvailabilityStatus, string> = {
  Unknown: "unknown",
  Available: "available",
  Unavailable: "unavailable",
  ApiError: "error",
  PaymentRequired: "error",
  Disabled: "unknown",
};

const statusFromSettings = (settings: KitcoSettings): KitcoStatus => ({
  isEnabled: settings.isEnabled,
  requestsUsed: settings.requestsUsed,
  requestLimit: settings.requestLimit,
  requestsRemaining: settings.requestsRemaining,
  warningThreshold: settings.warningThreshold,
  paymentWarning: settings.paymentWarning,
  paymentRequired: settings.paymentRequired,
  lastPaymentConfirmedAt: settings.lastPaymentConfirmedAt,
  lastPaymentReference: settings.lastPaymentReference,
  updatedAt: settings.updatedAt,
  availabilityStatus: settings.availabilityStatus,
  isAvailable: settings.isAvailable,
  lastAvailabilityCheckAt: settings.lastAvailabilityCheckAt,
  lastAvailabilityError: settings.lastAvailabilityError,
  availabilityCheckIntervalMinutes: settings.availabilityCheckIntervalMinutes,
});

const isValidKitcoUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname.toLowerCase() === "kitco.com" ||
        url.hostname.toLowerCase().endsWith(".kitco.com"));
  } catch {
    return false;
  }
};

const localizedError = (error: unknown, fallback: string) => {
  if (
    error instanceof KitcoApiError &&
    error.message &&
    error.message.length < 400 &&
    !/[\r\n]|\bat\s+[\w$.<>]+\s*\(/i.test(error.message)
  ) {
    return error.message;
  }
  return fallback;
};

export const Kitco = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const storedQuota = useAppSelector((state) => state.metalPrices.kitcoQuota);
  const [activeTab, setActiveTab] = useState<"status" | "settings">("status");
  const [settings, setSettings] = useState<KitcoSettings | null>(null);
  const [status, setStatus] = useState<KitcoStatus | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<KitcoSettingsFieldErrors>({});

  const [form, setForm] = useState<KitcoSettingsPayload>({
    url: "",
    cacheMinutes: 1,
    warningThreshold: 100,
    requestTimeoutSeconds: 30,
    availabilityCheckIntervalMinutes: 60,
  });

  const applySettings = useCallback((value: KitcoSettings) => {
    setSettings(value);
    setSettingsError(false);
    setForm({
      url: value.url,
      cacheMinutes: value.cacheMinutes,
      warningThreshold: value.warningThreshold,
      requestTimeoutSeconds: value.requestTimeoutSeconds,
      availabilityCheckIntervalMinutes: value.availabilityCheckIntervalMinutes,
    });
    setStatus((current) => ({
      ...statusFromSettings(value),
      ...current,
      isEnabled: value.isEnabled,
      warningThreshold: value.warningThreshold,
      availabilityCheckIntervalMinutes: value.availabilityCheckIntervalMinutes,
    }));
    dispatch(setKitcoQuota(kitcoQuotaFromStatus(statusFromSettings(value))));
  }, [dispatch]);

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(false);
    try {
      const currentStatus = await getKitcoStatus();
      setStatus(currentStatus);
      dispatch(setKitcoQuota(kitcoQuotaFromStatus(currentStatus)));
    } catch (error) {
      setStatusError(true);
      toast.error(localizedError(error, t("kitco.errors.statusLoadFailed")));
    } finally {
      setStatusLoading(false);
    }
  }, [dispatch, t]);

  useEffect(() => {
    let active = true;
    setSettingsLoading(true);
    getKitcoSettings()
      .then((value) => {
        if (active) applySettings(value);
      })
      .catch((error: unknown) => {
        if (active) {
          setSettingsError(true);
          toast.error(localizedError(error, t("kitco.errors.settingsLoadFailed")));
        }
      })
      .finally(() => {
        if (active) setSettingsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applySettings, t]);

  useEffect(() => {
    let active = true;
    const pollStatus = async () => {
      try {
        const currentStatus = await getKitcoStatus();
        if (active) {
          setStatus(currentStatus);
          setStatusError(false);
          dispatch(setKitcoQuota(kitcoQuotaFromStatus(currentStatus)));
        }
      } catch {
        if (active) setStatusError(true);
      } finally {
        if (active) setStatusLoading(false);
      }
    };

    void pollStatus();
    const intervalId = window.setInterval(() => void pollStatus(), 120_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [dispatch]);

  const quota = useMemo(() => ({
    requestsUsed: storedQuota?.requestsUsed ?? status?.requestsUsed ?? settings?.requestsUsed ?? 0,
    requestsRemaining: storedQuota?.requestsRemaining ?? status?.requestsRemaining ?? settings?.requestsRemaining ?? 0,
    requestLimit: storedQuota?.requestLimit ?? status?.requestLimit ?? settings?.requestLimit ?? 0,
    paymentWarning: storedQuota?.paymentWarning ?? status?.paymentWarning ?? settings?.paymentWarning ?? false,
    paymentRequired: storedQuota?.paymentRequired ?? status?.paymentRequired ?? settings?.paymentRequired ?? false,
  }), [settings, status, storedQuota]);

  const dateLocale = i18n.resolvedLanguage?.startsWith("hy")
    ? "hy-AM"
    : i18n.resolvedLanguage?.startsWith("ru")
      ? "ru-RU"
      : "en-US";
  const lastCheckedAt = status?.lastAvailabilityCheckAt
    ? new Date(status.lastAvailabilityCheckAt).toLocaleString(dateLocale)
    : "—";
  const availability = status?.availabilityStatus ?? "Unknown";
  const activeStatusClass = statusClass[availability];
  const lastAvailabilityError = status?.lastAvailabilityError;
  const safeAvailabilityError = lastAvailabilityError &&
    lastAvailabilityError.length < 400 &&
    !/[\r\n]|\bat\s+[\w$.<>]+\s*\(/i.test(lastAvailabilityError)
    ? lastAvailabilityError
    : lastAvailabilityError
      ? t("kitco.status.technicalErrorHidden")
      : null;

  const validate = (): KitcoSettingsFieldErrors => {
    const errors: KitcoSettingsFieldErrors = {};
    if (!isValidKitcoUrl(form.url.trim())) errors.url = t("kitco.validation.url");
    if (!Number.isInteger(form.cacheMinutes) || form.cacheMinutes < 1) {
      errors.cacheMinutes = t("kitco.validation.positiveInteger");
    }
    if (!Number.isInteger(form.warningThreshold) || form.warningThreshold < 0) {
      errors.warningThreshold = t("kitco.validation.nonNegativeInteger");
    }
    if (!Number.isInteger(form.requestTimeoutSeconds) || form.requestTimeoutSeconds < 1) {
      errors.requestTimeoutSeconds = t("kitco.validation.positiveInteger");
    }
    if (!Number.isInteger(form.availabilityCheckIntervalMinutes) || form.availabilityCheckIntervalMinutes < 1) {
      errors.availabilityCheckIntervalMinutes = t("kitco.validation.positiveInteger");
    }
    return errors;
  };

  const handleSave = async () => {
    const localErrors = validate();
    setFieldErrors(localErrors);
    if (Object.keys(localErrors).length) return;

    setIsSaving(true);
    try {
      const updated = await updateKitcoSettings({
        url: form.url.trim(),
        cacheMinutes: form.cacheMinutes,
        warningThreshold: form.warningThreshold,
        requestTimeoutSeconds: form.requestTimeoutSeconds,
        availabilityCheckIntervalMinutes: form.availabilityCheckIntervalMinutes,
      });
      applySettings(updated);
      setFieldErrors({});
      toast.success(t("kitco.messages.settingsSaved"));
    } catch (error) {
      if (error instanceof KitcoApiError && Object.keys(error.fieldErrors).length) {
        setFieldErrors(error.fieldErrors);
      } else {
        toast.error(localizedError(error, t("kitco.errors.settingsSaveFailed")));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testKitcoConnection();
      setStatus((current) => ({
        ...(current ?? (settings ? statusFromSettings(settings) : {
          isEnabled: true,
          lastPaymentConfirmedAt: null,
          lastPaymentReference: null,
          updatedAt: null,
          warningThreshold: form.warningThreshold,
          availabilityCheckIntervalMinutes: form.availabilityCheckIntervalMinutes,
        })),
        availabilityStatus: result.status,
        isAvailable: result.isAvailable,
        lastAvailabilityCheckAt: result.checkedAt,
        lastAvailabilityError: result.error,
        requestsUsed: result.requestsUsed,
        requestLimit: result.requestLimit,
        requestsRemaining: result.requestsRemaining,
        paymentWarning: result.paymentWarning,
        paymentRequired: result.paymentRequired,
      }));
      dispatch(setKitcoQuota({
        requestsUsed: result.requestsUsed,
        requestLimit: result.requestLimit,
        requestsRemaining: result.requestsRemaining,
        paymentWarning: result.paymentWarning,
        paymentRequired: result.paymentRequired,
      }));
      if (result.paymentRequired || result.status === "PaymentRequired") {
        toast.error(t("kitco.quota.paymentRequired"));
      } else {
        toast.success(t(`kitco.status.${result.status}`));
      }
    } catch (error) {
      if (error instanceof KitcoApiError && error.statusCode === 402) {
        const quotaUpdate = { ...error.quota, paymentRequired: true };
        dispatch(setKitcoQuota(quotaUpdate));
        if (settings) {
          setStatus((current) => ({
            ...(current ?? statusFromSettings(settings)),
            ...quotaUpdate,
            availabilityStatus: "PaymentRequired",
            isAvailable: false,
            lastAvailabilityCheckAt: new Date().toISOString(),
          }));
        }
        toast.error(t("kitco.quota.paymentRequired"));
        return;
      }
      toast.error(localizedError(error, t("kitco.errors.connectionTestFailed")));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.titleIcon} aria-hidden="true"><Gem size={19} /></span>
        <div>
          <span className={styles.eyebrow}>{t("settings.groups.integrations")}</span>
          <h1>{t("kitco.title")}</h1>
          <p>{t("kitco.description")}</p>
        </div>
      </header>

      <nav className={styles.tabs} role="tablist" aria-label={t("kitco.navigation.label")}>
        <button type="button" role="tab" id="kitco-status-tab" aria-controls="kitco-status-panel"
          aria-selected={activeTab === "status"} className={activeTab === "status" ? styles.activeTab : ""}
          onClick={() => setActiveTab("status")}>
          <Activity size={16} aria-hidden="true" />{t("kitco.navigation.status")}
        </button>
        <button type="button" role="tab" id="kitco-settings-tab" aria-controls="kitco-settings-panel"
          aria-selected={activeTab === "settings"} className={activeTab === "settings" ? styles.activeTab : ""}
          onClick={() => setActiveTab("settings")}>
          <Settings2 size={16} aria-hidden="true" />{t("kitco.navigation.settings")}
        </button>
      </nav>

      {activeTab === "status" && (
        <section id="kitco-status-panel" role="tabpanel" aria-labelledby="kitco-status-tab" className={styles.tabPanel}>
          {quota.paymentRequired ? (
            <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
              <strong>{t("kitco.quota.paymentRequiredTitle")}</strong><span>{t("kitco.quota.paymentRequired")}</span>
            </div>
          ) : quota.paymentWarning ? (
            <div className={`${styles.notice} ${styles.noticeWarning}`} role="status">
              <strong>{t("kitco.quota.paymentWarningTitle")}</strong><span>{t("kitco.quota.paymentWarning")}</span>
            </div>
          ) : null}
          <section className={styles.panel}>
            <div className={styles.sectionHeader}>
              <h2><Activity size={17} aria-hidden="true" />{t("kitco.status.title")}</h2>
              <Button variant="secondary" size="small" onClick={() => void refreshStatus()} disabled={statusLoading}>
                <RefreshCw size={14} aria-hidden="true" className={statusLoading ? styles.spinning : undefined} />{t("common.refresh")}
              </Button>
            </div>
            <div className={styles.statusGrid}>
              <div className={styles.statusCard}><span>{t("kitco.status.availability")}</span>
                <strong className={`${styles.statusBadge} ${styles[`status_${activeStatusClass}`]}`}><i aria-hidden="true" />{t(`kitco.status.${availability}`)}</strong>
              </div>
              <div className={styles.statusCard}><span>{t("kitco.status.lastChecked")}</span><strong>{lastCheckedAt}</strong></div>
              <div className={styles.statusCard}><span>{t("kitco.status.autoCheckInterval")}</span>
                <strong>{status?.availabilityCheckIntervalMinutes ?? settings?.availabilityCheckIntervalMinutes ?? 60} {t("kitco.units.minutes")}</strong>
              </div>
              <div className={styles.statusCard}><span>{t("kitco.status.integration")}</span>
                <strong className={(status?.isEnabled ?? settings?.isEnabled) ? styles.enabled : styles.disabled}>
                  {(status?.isEnabled ?? settings?.isEnabled) ? t("kitco.status.enabled") : t("kitco.status.disabled")}
                </strong>
              </div>
            </div>
            {statusError && <div className={styles.inlineError} role="alert">{t("kitco.errors.statusLoadFailed")}</div>}
            {safeAvailabilityError && <div className={styles.inlineError} role="status">
              <strong>{t("kitco.status.lastError")}</strong><span>{safeAvailabilityError}</span>
            </div>}
            <div className={styles.testActions}>
              <Button onClick={() => void handleTestConnection()} disabled={isTesting} title={t("kitco.status.testTooltip")}>
                <Activity size={15} aria-hidden="true" />{isTesting ? t("kitco.status.testing") : t("kitco.status.testConnection")}
              </Button>
              <span><Clock3 size={14} aria-hidden="true" />{t("kitco.status.testQuotaNote")}</span>
            </div>
          </section>
          <section className={styles.panel}>
            <div className={styles.sectionHeader}><h2><Gem size={17} aria-hidden="true" />{t("kitco.quota.title")}</h2></div>
            <div className={styles.quotaGrid}>
              <div className={styles.quotaCard}><span>{t("kitco.quota.used")}</span><strong>{quota.requestsUsed.toLocaleString(dateLocale)}</strong></div>
              <div className={styles.quotaCard}><span>{t("kitco.quota.remaining")}</span><strong>{quota.requestsRemaining.toLocaleString(dateLocale)}</strong></div>
              <div className={styles.quotaCard}><span>{t("kitco.quota.limit")}</span><strong>{quota.requestLimit.toLocaleString(dateLocale)}</strong></div>
            </div>
          </section>
        </section>
      )}

      {activeTab === "settings" && (
        settingsLoading ? (
          <div id="kitco-settings-panel" role="tabpanel" aria-labelledby="kitco-settings-tab" className={styles.loading} aria-busy="true">
            {t("common.loading")}
          </div>
        ) : settingsError || !settings ? (
          <section id="kitco-settings-panel" role="tabpanel" aria-labelledby="kitco-settings-tab" className={styles.panel} aria-live="polite">
            <p>{t("kitco.errors.settingsLoadFailed")}</p>
            <Button variant="secondary" onClick={() => {
              setSettingsLoading(true);
              setSettingsError(false);
              void getKitcoSettings().then(applySettings).catch((error: unknown) => {
                setSettingsError(true);
                toast.error(localizedError(error, t("kitco.errors.settingsLoadFailed")));
              }).finally(() => setSettingsLoading(false));
            }}>
              <RefreshCw size={15} aria-hidden="true" />{t("common.refresh")}
            </Button>
          </section>
        ) : (
          <section id="kitco-settings-panel" role="tabpanel" aria-labelledby="kitco-settings-tab" className={styles.tabPanel}>
            <section className={styles.panel}>
              <div className={styles.sectionHeader}><h2><Save size={17} aria-hidden="true" />{t("kitco.settings.title")}</h2></div>
              <div className={styles.formGrid}>
                <TextField className={styles.wide} label={t("kitco.settings.url")} type="url" value={form.url}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, url: event.target.value }));
                    setFieldErrors((current) => ({ ...current, url: undefined }));
                  }} error={Boolean(fieldErrors.url)} helperText={fieldErrors.url} required />
                <TextField label={t("kitco.settings.cacheMinutes")} type="number" min={1} step={1} value={form.cacheMinutes}
                  suffix={t("kitco.units.minutes")} onChange={(event) => {
                    setForm((current) => ({ ...current, cacheMinutes: Number(event.target.value) }));
                    setFieldErrors((current) => ({ ...current, cacheMinutes: undefined }));
                  }} error={Boolean(fieldErrors.cacheMinutes)} helperText={fieldErrors.cacheMinutes} />
                <TextField label={t("kitco.settings.requestTimeoutSeconds")} type="number" min={1} step={1} value={form.requestTimeoutSeconds}
                  suffix={t("kitco.units.seconds")} onChange={(event) => {
                    setForm((current) => ({ ...current, requestTimeoutSeconds: Number(event.target.value) }));
                    setFieldErrors((current) => ({ ...current, requestTimeoutSeconds: undefined }));
                  }} error={Boolean(fieldErrors.requestTimeoutSeconds)} helperText={fieldErrors.requestTimeoutSeconds} />
                <TextField label={t("kitco.settings.availabilityCheckIntervalMinutes")} type="number" min={1} step={1}
                  value={form.availabilityCheckIntervalMinutes} suffix={t("kitco.units.minutes")} onChange={(event) => {
                    setForm((current) => ({ ...current, availabilityCheckIntervalMinutes: Number(event.target.value) }));
                    setFieldErrors((current) => ({ ...current, availabilityCheckIntervalMinutes: undefined }));
                  }} error={Boolean(fieldErrors.availabilityCheckIntervalMinutes)} helperText={fieldErrors.availabilityCheckIntervalMinutes} />
                <TextField label={t("kitco.settings.warningThreshold")} type="number" min={0} step={1} value={form.warningThreshold}
                  error={Boolean(fieldErrors.warningThreshold)} helperText={fieldErrors.warningThreshold ?? t("kitco.settings.warningThresholdHint")}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, warningThreshold: Number(event.target.value) }));
                    setFieldErrors((current) => ({ ...current, warningThreshold: undefined }));
                  }} />
                <div className={styles.readOnly}>
                  <span>{t("kitco.settings.requestLimit")}</span><strong>{settings.requestLimit.toLocaleString(dateLocale)}</strong>
                  <small>{t("kitco.settings.requestLimitHint")}</small>
                </div>
              </div>
              <div className={styles.formActions}>
                <Button onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving ? <RefreshCw size={15} className={styles.spinning} /> : <Check size={15} />}
                  {isSaving ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            </section>
          </section>
        )
      )}
    </main>
  );
};
