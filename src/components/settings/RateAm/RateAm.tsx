import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  Activity,
  CalendarClock,
  Check,
  Clock3,
  RefreshCw,
  Settings2,
  Wifi,
} from "lucide-react";
import { Button, Switch, TextField } from "@/ui-kit";
import {
  getRateAmSettings,
  getRateAmStatus,
  testRateAmConnection,
  updateRateAmSettings,
} from "@/services/rateAm";
import {
  RateAmApiError,
  type RateAmAvailabilityStatus,
  type RateAmConnectionTestResult,
  type RateAmSettings,
  type RateAmSettingsFieldErrors,
  type RateAmSettingsPayload,
  type RateAmStatus,
} from "@/types/rateAm";
import styles from "./RateAm.module.css";

const statusClass: Record<RateAmAvailabilityStatus, string> = {
  Unknown: "unknown",
  Available: "available",
  Unavailable: "error",
  ApiError: "error",
  PaymentRequired: "error",
  Disabled: "unknown",
};

const toStatus = (settings: RateAmSettings): RateAmStatus => ({
  isEnabled: settings.isEnabled,
  requestsUsed: settings.requestsUsed,
  lastPaymentConfirmedAt: settings.lastPaymentConfirmedAt,
  paymentExpiresAt: settings.paymentExpiresAt,
  daysUntilPaymentExpiry: settings.daysUntilPaymentExpiry,
  warningDays: settings.warningDays,
  paymentWarning: settings.paymentWarning,
  paymentRequired: settings.paymentRequired,
  lastPaymentReference: settings.lastPaymentReference,
  availabilityStatus: settings.availabilityStatus,
  isAvailable: settings.isAvailable,
  lastAvailabilityCheckAt: settings.lastAvailabilityCheckAt,
  lastAvailabilityError: settings.lastAvailabilityError,
  availabilityCheckIntervalMinutes: settings.availabilityCheckIntervalMinutes,
});

const payloadFrom = (settings: RateAmSettings): RateAmSettingsPayload => ({
  url: settings.url,
  cacheMinutes: settings.cacheMinutes,
  warningDays: settings.warningDays,
  requestTimeoutSeconds: settings.requestTimeoutSeconds,
  availabilityCheckIntervalMinutes: settings.availabilityCheckIntervalMinutes,
  isEnabled: settings.isEnabled,
});

const isValidRateAmUrl = (value: string) => {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:" &&
      (hostname === "rate.am" || hostname.endsWith(".rate.am"));
  } catch {
    return false;
  }
};

const localizedError = (error: unknown, fallback: string) => {
  if (
    error instanceof RateAmApiError &&
    error.message &&
    error.message.length < 400 &&
    !/[\r\n]|\bat\s+[\w$.<>]+\s*\(/i.test(error.message)
  ) {
    return error.message;
  }
  return fallback;
};

export const RateAm = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"status" | "settings">("status");
  const [settings, setSettings] = useState<RateAmSettings | null>(null);
  const [status, setStatus] = useState<RateAmStatus | null>(null);
  const [form, setForm] = useState<RateAmSettingsPayload | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RateAmSettingsFieldErrors>({});

  const refreshSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError(false);
    try {
      const currentSettings = await getRateAmSettings();
      setSettings(currentSettings);
      setForm(payloadFrom(currentSettings));
      setStatus((current) => current ?? toStatus(currentSettings));
    } catch (error) {
      setSettingsError(true);
      toast.error(localizedError(error, t("rateAm.errors.settingsLoadFailed")));
    } finally {
      setSettingsLoading(false);
    }
  }, [t]);

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(false);
    try {
      const currentStatus = await getRateAmStatus();
      setStatus(currentStatus);
    } catch (error) {
      setStatusError(true);
      toast.error(localizedError(error, t("rateAm.errors.statusLoadFailed")));
    } finally {
      setStatusLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refreshSettings();
    void refreshStatus();
  }, [refreshSettings, refreshStatus]);

  const dateLocale = i18n.resolvedLanguage?.startsWith("hy")
    ? "hy-AM"
    : i18n.resolvedLanguage?.startsWith("am")
      ? "hy-AM"
    : i18n.resolvedLanguage?.startsWith("ru")
      ? "ru-RU"
      : "en-US";
  const formatDate = useCallback((value: string | null | undefined) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString(dateLocale);
  }, [dateLocale]);

  const currentStatus = status ?? (settings ? toStatus(settings) : null);
  const availability = currentStatus?.availabilityStatus ?? "Unknown";
  const activeStatusClass = statusClass[availability];
  const safeAvailabilityError = useMemo(() => {
    const message = currentStatus?.lastAvailabilityError;
    if (!message) return null;
    return message.length < 400 && !/[\r\n]|\bat\s+[\w$.<>]+\s*\(/i.test(message)
      ? message
      : t("rateAm.status.technicalErrorHidden");
  }, [currentStatus?.lastAvailabilityError, t]);

  const validate = (): RateAmSettingsFieldErrors => {
    const errors: RateAmSettingsFieldErrors = {};
    if (!form) return errors;
    if (!isValidRateAmUrl(form.url.trim())) errors.url = t("rateAm.validation.url");
    if (!Number.isInteger(form.cacheMinutes) || form.cacheMinutes < 1) {
      errors.cacheMinutes = t("rateAm.validation.positiveInteger");
    }
    if (!Number.isInteger(form.warningDays) || form.warningDays < 0) {
      errors.warningDays = t("rateAm.validation.nonNegativeInteger");
    }
    if (!Number.isInteger(form.requestTimeoutSeconds) || form.requestTimeoutSeconds < 1) {
      errors.requestTimeoutSeconds = t("rateAm.validation.positiveInteger");
    }
    if (
      !Number.isInteger(form.availabilityCheckIntervalMinutes) ||
      form.availabilityCheckIntervalMinutes < 1
    ) {
      errors.availabilityCheckIntervalMinutes = t("rateAm.validation.positiveInteger");
    }
    return errors;
  };

  const handleSave = async () => {
    if (!form) return;
    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setIsSaving(true);
    try {
      const updatedSettings = await updateRateAmSettings({
        ...form,
        url: form.url.trim(),
      });
      setSettings(updatedSettings);
      setForm(payloadFrom(updatedSettings));
      setStatus(toStatus(updatedSettings));
      setFieldErrors({});
      toast.success(t("rateAm.messages.settingsSaved"));
    } catch (error) {
      if (error instanceof RateAmApiError && Object.keys(error.fieldErrors).length) {
        setFieldErrors(error.fieldErrors);
      } else {
        toast.error(localizedError(error, t("rateAm.errors.settingsSaveFailed")));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const applyTestResult = (result: RateAmConnectionTestResult) => {
    const previous = status ?? (settings ? toStatus(settings) : null);
    if (previous) {
      const updatedStatus: RateAmStatus = {
        ...previous,
        availabilityStatus: result.status,
        isAvailable: result.isAvailable,
        lastAvailabilityCheckAt: result.checkedAt,
        lastAvailabilityError: result.error,
        requestsUsed: result.requestsUsed,
        paymentExpiresAt: result.paymentExpiresAt,
        daysUntilPaymentExpiry: result.daysUntilPaymentExpiry,
        paymentWarning: result.paymentWarning,
        paymentRequired: result.paymentRequired,
      };
      setStatus(updatedStatus);
    }
    setSettings((current) => current ? ({
      ...current,
      availabilityStatus: result.status,
      isAvailable: result.isAvailable,
      lastAvailabilityCheckAt: result.checkedAt,
      lastAvailabilityError: result.error,
      requestsUsed: result.requestsUsed,
      paymentExpiresAt: result.paymentExpiresAt,
      daysUntilPaymentExpiry: result.daysUntilPaymentExpiry,
      paymentWarning: result.paymentWarning,
      paymentRequired: result.paymentRequired,
    }) : current);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testRateAmConnection();
      applyTestResult(result);
      if (result.paymentRequired || result.status === "PaymentRequired") {
        toast.error(t("rateAm.payment.required"));
      } else {
        toast.success(t(`rateAm.status.${result.status}`));
      }
    } catch (error) {
      toast.error(localizedError(error, t("rateAm.errors.connectionTestFailed")));
    } finally {
      setIsTesting(false);
    }
  };

  const updateFormField = <K extends keyof RateAmSettingsPayload,>(
    key: K,
    value: RateAmSettingsPayload[K],
  ) => {
    setForm((current) => current ? { ...current, [key]: value } : current);
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const lastCheckedAt = formatDate(currentStatus?.lastAvailabilityCheckAt);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.titleIcon} aria-hidden="true"><Activity size={19} /></span>
        <div>
          <span className={styles.eyebrow}>{t("settings.groups.integrations")}</span>
          <h1>{t("rateAm.title")}</h1>
          <p>{t("rateAm.description")}</p>
        </div>
      </header>

      <nav className={styles.tabs} role="tablist" aria-label={t("rateAm.navigation.label")}>
        <button type="button" role="tab" id="rate-am-status-tab" aria-controls="rate-am-status-panel"
          aria-selected={activeTab === "status"} className={activeTab === "status" ? styles.activeTab : ""}
          onClick={() => setActiveTab("status")}>
          <Activity size={16} aria-hidden="true" />{t("rateAm.navigation.status")}
        </button>
        <button type="button" role="tab" id="rate-am-settings-tab" aria-controls="rate-am-settings-panel"
          aria-selected={activeTab === "settings"} className={activeTab === "settings" ? styles.activeTab : ""}
          onClick={() => setActiveTab("settings")}>
          <Settings2 size={16} aria-hidden="true" />{t("rateAm.navigation.settings")}
        </button>
      </nav>

      {activeTab === "status" && (
        <section id="rate-am-status-panel" role="tabpanel" aria-labelledby="rate-am-status-tab" className={styles.tabPanel}>
          {currentStatus?.paymentRequired ? (
            <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
              <strong>{t("rateAm.payment.requiredTitle")}</strong>
              <span>{t("rateAm.payment.required")}</span>
            </div>
          ) : currentStatus?.paymentWarning ? (
            <div className={`${styles.notice} ${styles.noticeWarning}`} role="status">
              <strong>{t("rateAm.payment.warningTitle")}</strong>
              <span>
                {t("rateAm.payment.warning", {
                  expiry: formatDate(currentStatus.paymentExpiresAt),
                  days: currentStatus.daysUntilPaymentExpiry ?? "—",
                })}
              </span>
            </div>
          ) : null}

          <section className={styles.panel}>
            <div className={styles.sectionHeader}>
              <h2><Wifi size={17} aria-hidden="true" />{t("rateAm.status.title")}</h2>
              <Button variant="secondary" size="small" onClick={() => void refreshStatus()} disabled={statusLoading}>
                <RefreshCw size={14} aria-hidden="true" className={statusLoading ? styles.spinning : undefined} />
                {t("common.refresh")}
              </Button>
            </div>
            {statusLoading && !currentStatus ? (
              <div className={styles.loading} aria-busy="true">{t("common.loading")}</div>
            ) : statusError && !currentStatus ? (
              <div className={styles.emptyState} role="alert">
                <p>{t("rateAm.errors.statusLoadFailed")}</p>
                <Button variant="secondary" onClick={() => void refreshStatus()}>{t("common.refresh")}</Button>
              </div>
            ) : currentStatus ? (
              <>
                <div className={styles.statusGrid}>
                  <div className={styles.statusCard}>
                    <span>{t("rateAm.status.availability")}</span>
                    <strong className={`${styles.statusBadge} ${styles[`status_${activeStatusClass}`]}`}>
                      <i aria-hidden="true" />{t(`rateAm.status.${availability}`)}
                    </strong>
                  </div>
                  <div className={styles.statusCard}>
                    <span>{t("rateAm.status.integration")}</span>
                    <strong className={currentStatus.isEnabled ? styles.enabled : styles.disabled}>
                      {currentStatus.isEnabled ? t("rateAm.status.enabled") : t("rateAm.status.disabled")}
                    </strong>
                  </div>
                  <div className={styles.statusCard}>
                    <span>{t("rateAm.status.requestsUsed")}</span>
                    <strong>{currentStatus.requestsUsed.toLocaleString(dateLocale)}</strong>
                    <small>{t("rateAm.status.requestsUsedHint")}</small>
                  </div>
                  <div className={styles.statusCard}>
                    <span>{t("rateAm.status.lastChecked")}</span>
                    <strong>{lastCheckedAt}</strong>
                  </div>
                  <div className={styles.statusCard}>
                    <span>{t("rateAm.status.autoCheckInterval")}</span>
                    <strong>{currentStatus.availabilityCheckIntervalMinutes} {t("rateAm.units.minutes")}</strong>
                  </div>
                </div>
                {statusError && <div className={styles.inlineError} role="alert">{t("rateAm.errors.statusLoadFailed")}</div>}
                {safeAvailabilityError && (
                  <div className={styles.inlineError} role="status">
                    <strong>{t("rateAm.status.lastError")}</strong><span>{safeAvailabilityError}</span>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>{t("rateAm.status.noStatus")}</div>
            )}
            <div className={styles.testActions}>
              <Button onClick={() => void handleTestConnection()} disabled={isTesting || (!settings && !status)}>
                <Activity size={15} aria-hidden="true" className={isTesting ? styles.spinning : undefined} />
                {isTesting ? t("rateAm.status.testing") : t("rateAm.status.testConnection")}
              </Button>
              <span><Clock3 size={14} aria-hidden="true" />{t("rateAm.status.testNote")}</span>
            </div>
          </section>

          {currentStatus && (
            <section className={styles.panel}>
              <div className={styles.sectionHeader}>
                <h2><CalendarClock size={17} aria-hidden="true" />{t("rateAm.subscription.title")}</h2>
              </div>
              <div className={styles.statusGrid}>
                <div className={styles.statusCard}>
                  <span>{t("rateAm.subscription.lastConfirmed")}</span>
                  <strong>{formatDate(currentStatus.lastPaymentConfirmedAt)}</strong>
                </div>
                <div className={styles.statusCard}>
                  <span>{t("rateAm.subscription.expiresAt")}</span>
                  <strong>{formatDate(currentStatus.paymentExpiresAt)}</strong>
                </div>
                <div className={styles.statusCard}>
                  <span>{t("rateAm.subscription.daysRemaining")}</span>
                  <strong>
                    {currentStatus.daysUntilPaymentExpiry === null
                      ? "—"
                      : t("rateAm.subscription.daysValue", { count: currentStatus.daysUntilPaymentExpiry })}
                  </strong>
                </div>
                <div className={styles.statusCard}>
                  <span>{t("rateAm.subscription.paymentReference")}</span>
                  <strong>{currentStatus.lastPaymentReference || "—"}</strong>
                </div>
              </div>
            </section>
          )}
        </section>
      )}

      {activeTab === "settings" && (
        settingsLoading && !form ? (
          <div id="rate-am-settings-panel" role="tabpanel" aria-labelledby="rate-am-settings-tab" className={styles.loading} aria-busy="true">
            {t("common.loading")}
          </div>
        ) : settingsError && !form ? (
          <section id="rate-am-settings-panel" role="tabpanel" aria-labelledby="rate-am-settings-tab" className={styles.tabPanel}>
            <div className={styles.panel} role="alert">
              <p>{t("rateAm.errors.settingsLoadFailed")}</p>
              <Button variant="secondary" onClick={() => void refreshSettings()}>
                <RefreshCw size={15} aria-hidden="true" />{t("common.refresh")}
              </Button>
            </div>
          </section>
        ) : form ? (
          <section id="rate-am-settings-panel" role="tabpanel" aria-labelledby="rate-am-settings-tab" className={styles.tabPanel}>
            <section className={styles.panel}>
              <div className={styles.sectionHeader}>
                <h2><Settings2 size={17} aria-hidden="true" />{t("rateAm.settings.title")}</h2>
              </div>
              <div className={styles.formGrid}>
                <TextField className={styles.wide} label={t("rateAm.settings.url")} type="url" value={form.url}
                  onChange={(event) => updateFormField("url", event.target.value)}
                  error={Boolean(fieldErrors.url)} helperText={fieldErrors.url} required />
                <TextField label={t("rateAm.settings.cacheMinutes")} type="number" min={1} step={1} value={form.cacheMinutes}
                  suffix={t("rateAm.units.minutes")} onChange={(event) => updateFormField("cacheMinutes", Number(event.target.value))}
                  error={Boolean(fieldErrors.cacheMinutes)} helperText={fieldErrors.cacheMinutes} />
                <TextField label={t("rateAm.settings.warningDays")} type="number" min={0} step={1} value={form.warningDays}
                  suffix={t("rateAm.units.days")} onChange={(event) => updateFormField("warningDays", Number(event.target.value))}
                  error={Boolean(fieldErrors.warningDays)} helperText={fieldErrors.warningDays} />
                <TextField label={t("rateAm.settings.requestTimeoutSeconds")} type="number" min={1} step={1}
                  value={form.requestTimeoutSeconds} suffix={t("rateAm.units.seconds")}
                  onChange={(event) => updateFormField("requestTimeoutSeconds", Number(event.target.value))}
                  error={Boolean(fieldErrors.requestTimeoutSeconds)} helperText={fieldErrors.requestTimeoutSeconds} />
                <TextField label={t("rateAm.settings.availabilityCheckIntervalMinutes")} type="number" min={1} step={1}
                  value={form.availabilityCheckIntervalMinutes} suffix={t("rateAm.units.minutes")}
                  onChange={(event) => updateFormField("availabilityCheckIntervalMinutes", Number(event.target.value))}
                  error={Boolean(fieldErrors.availabilityCheckIntervalMinutes)} helperText={fieldErrors.availabilityCheckIntervalMinutes} />
                <div className={styles.enabledControl}>
                  <span>{t("rateAm.settings.integrationEnabled")}</span>
                  <Switch checked={form.isEnabled} label={form.isEnabled
                    ? t("rateAm.status.enabled")
                    : t("rateAm.status.disabled")}
                    onCheckedChange={(checked) => updateFormField("isEnabled", checked)} />
                </div>
              </div>
              <div className={styles.formActions}>
                <Button onClick={() => void handleSave()} disabled={isSaving || settingsLoading}>
                  {isSaving ? <RefreshCw size={15} className={styles.spinning} /> : <Check size={15} />}
                  {isSaving ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            </section>
          </section>
        ) : null
      )}
    </main>
  );
};
