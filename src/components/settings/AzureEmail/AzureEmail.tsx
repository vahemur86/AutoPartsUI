import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  Activity,
  Check,
  Eye,
  EyeOff,
  Mail,
  RefreshCw,
  Send,
  Settings2,
} from "lucide-react";
import {
  Button,
  ConfirmationModal,
  Select,
  Switch,
  Textarea,
  TextField,
} from "@/ui-kit";
import {
  getAzureEmailSettings,
  sendAzureEmailTest,
  updateAzureEmailSettings,
} from "@/services/azureEmail";
import {
  AzureEmailApiError,
  type AzureEmailAuthenticationMode,
  type AzureEmailSettings,
  type AzureEmailSettingsFieldErrors,
  type AzureEmailSettingsPayload,
  type AzureEmailTestStatus,
} from "@/types/azureEmail";
import styles from "./AzureEmail.module.css";

type TestResultState = {
  status: AzureEmailTestStatus;
  checkedAt: string | null;
  error: string | null;
};

type TemplateField =
  | "invitationSubject"
  | "invitationMessage"
  | "invitationTextBody"
  | "invitationHtmlBody"
  | "passwordResetSubject"
  | "passwordResetMessage"
  | "passwordResetTextBody"
  | "passwordResetHtmlBody";

interface TemplateEditorProps {
  title: string;
  subjectLabel: string;
  messageLabel: string;
  textBodyLabel: string;
  htmlBodyLabel: string;
  placeholdersLabel: string;
  previewLabel: string;
  hidePreviewLabel: string;
  previewTitle: string;
  previewHint: string;
  placeholders: readonly string[];
  subject: string;
  message: string;
  textBody: string;
  htmlBody: string;
  fieldErrors: AzureEmailSettingsFieldErrors;
  fieldNames: {
    subject: TemplateField;
    message: TemplateField;
    textBody: TemplateField;
    htmlBody: TemplateField;
  };
  onChange: (field: TemplateField, value: string) => void;
}

const TemplateEditor = ({
  title,
  subjectLabel,
  messageLabel,
  textBodyLabel,
  htmlBodyLabel,
  placeholdersLabel,
  previewLabel,
  hidePreviewLabel,
  previewTitle,
  previewHint,
  placeholders,
  subject,
  message,
  textBody,
  htmlBody,
  fieldErrors,
  fieldNames,
  onChange,
}: TemplateEditorProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewHtml = useMemo(() => {
    const samples: Record<string, string> = {
      "{UserName}": "Անի",
      "{Subject}": subject,
      "{Message}": message,
      "{ActionUrl}": "https://example.invalid/action",
      "{ActionLabel}": "Շարունակել",
      "{ValidityHours}": "24",
      "{Year}": String(new Date().getFullYear()),
    };
    const renderedBody = placeholders.reduce(
      (body, placeholder) =>
        body.replaceAll(placeholder, escapeHtml(samples[placeholder] ?? placeholder)),
      htmlBody,
    );
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; form-action 'none'; base-uri 'none'"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:24px;color:#242424;background:#fff;font:14px/1.5 Arial,sans-serif;overflow-wrap:anywhere}table{max-width:100%}img{max-width:100%;height:auto}</style></head><body>${renderedBody}</body></html>`;
  }, [htmlBody, message, placeholders, subject]);

  return (
    <section className={styles.templateSection}>
      <div className={styles.templateHeader}>
        <h3>{title}</h3>
        <div className={styles.placeholderHelp}>
          <span>{placeholdersLabel}</span>
          <div className={styles.placeholderList}>
            {placeholders.map((placeholder) => (
              <code key={placeholder}>{placeholder}</code>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.formGrid}>
        <TextField
          className={styles.wide}
          label={subjectLabel}
          value={subject}
          onChange={(event) => onChange(fieldNames.subject, event.target.value)}
          error={Boolean(fieldErrors[fieldNames.subject])}
          helperText={fieldErrors[fieldNames.subject]}
        />
        <Textarea
          className={styles.wide}
          label={messageLabel}
          rows={3}
          value={message}
          onChange={(event) => onChange(fieldNames.message, event.target.value)}
          error={Boolean(fieldErrors[fieldNames.message])}
          helperText={fieldErrors[fieldNames.message]}
        />
        <Textarea
          label={textBodyLabel}
          rows={6}
          value={textBody}
          onChange={(event) => onChange(fieldNames.textBody, event.target.value)}
          error={Boolean(fieldErrors[fieldNames.textBody])}
          helperText={fieldErrors[fieldNames.textBody]}
        />
        <div className={styles.htmlEditor}>
          <Textarea
            label={htmlBodyLabel}
            rows={6}
            value={htmlBody}
            onChange={(event) => onChange(fieldNames.htmlBody, event.target.value)}
            error={Boolean(fieldErrors[fieldNames.htmlBody])}
            helperText={fieldErrors[fieldNames.htmlBody]}
          />
          <Button
            type="button"
            variant="secondary"
            size="small"
            aria-expanded={previewOpen}
            onClick={() => setPreviewOpen((open) => !open)}
          >
            {previewOpen ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
            {previewOpen ? hidePreviewLabel : previewLabel}
          </Button>
          {previewOpen && (
            <div className={styles.preview}>
              <div className={styles.previewHeader}>
                <strong>{previewTitle}</strong>
                <span>{previewHint}</span>
              </div>
              <iframe
                title={previewTitle}
                className={styles.previewFrame}
                sandbox=""
                referrerPolicy="no-referrer"
                srcDoc={previewHtml}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);

const isValidEndpoint = (value: string) => {
  try {
    const endpoint = new URL(value);
    return endpoint.protocol === "https:" &&
      endpoint.hostname.toLowerCase().endsWith(".communication.azure.com") &&
      !endpoint.username &&
      !endpoint.password;
  } catch {
    return false;
  }
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const payloadFrom = (settings: AzureEmailSettings): AzureEmailSettingsPayload => ({
  endpoint: settings.endpoint,
  senderAddress: settings.senderAddress,
  authenticationMode: settings.authenticationMode,
  accessKey: null,
  isEnabled: settings.isEnabled,
  invitationSubject: settings.invitationSubject,
  invitationMessage: settings.invitationMessage,
  invitationTextBody: settings.invitationTextBody,
  invitationHtmlBody: settings.invitationHtmlBody,
  passwordResetSubject: settings.passwordResetSubject,
  passwordResetMessage: settings.passwordResetMessage,
  passwordResetTextBody: settings.passwordResetTextBody,
  passwordResetHtmlBody: settings.passwordResetHtmlBody,
});

const localizedError = (error: unknown, fallback: string) => {
  if (
    error instanceof AzureEmailApiError &&
    error.message &&
    error.message.length < 400 &&
    !/[\r\n]|\bat\s+[\w$.<>]+\s*\(/i.test(error.message)
  ) {
    return error.message;
  }
  return fallback;
};

const statusClass: Record<AzureEmailTestStatus, string> = {
  NotTested: "unknown",
  Succeeded: "success",
  Failed: "error",
};

const templatePlaceholders = [
  "{UserName}",
  "{Subject}",
  "{Message}",
  "{ActionUrl}",
  "{ActionLabel}",
  "{ValidityHours}",
  "{Year}",
];

export const AzureEmail = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<"status" | "settings" | "templates">("status");
  const [activeTemplate, setActiveTemplate] = useState<"invitation" | "passwordReset">("invitation");
  const [settings, setSettings] = useState<AzureEmailSettings | null>(null);
  const [form, setForm] = useState<AzureEmailSettingsPayload | null>(null);
  const [accessKey, setAccessKey] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AzureEmailSettingsFieldErrors>({});
  const [recipientError, setRecipientError] = useState<string | undefined>();
  const [testResult, setTestResult] = useState<TestResultState | null>(null);

  const refreshSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError(false);
    try {
      const currentSettings = await getAzureEmailSettings();
      setSettings(currentSettings);
      setForm(payloadFrom(currentSettings));
      setAccessKey("");
      setFieldErrors({});
      setTestResult(null);
    } catch (error) {
      setSettingsError(true);
      toast.error(localizedError(error, t("azureEmail.errors.settingsLoadFailed")));
    } finally {
      setSettingsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const dateLocale = i18n.resolvedLanguage?.startsWith("ru")
    ? "ru-RU"
    : i18n.resolvedLanguage?.startsWith("am") ||
        i18n.resolvedLanguage?.startsWith("hy")
      ? "hy-AM"
      : "en-US";

  const formatDate = useCallback((value: string | null | undefined) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString(dateLocale);
  }, [dateLocale]);

  const currentTest = useMemo<TestResultState>(() => testResult ?? ({
    status: settings?.lastTestStatus ?? "NotTested",
    checkedAt: settings?.lastTestAt ?? null,
    error: settings?.lastTestError ?? null,
  }), [settings, testResult]);

  const validateSettings = (): AzureEmailSettingsFieldErrors => {
    const errors: AzureEmailSettingsFieldErrors = {};
    if (!form) return errors;
    if (!isValidEndpoint(form.endpoint.trim())) {
      errors.endpoint = t("azureEmail.validation.endpoint");
    }
    if (!isValidEmail(form.senderAddress.trim())) {
      errors.senderAddress = t("azureEmail.validation.email");
    }
    if (
      form.authenticationMode === "AccessKey" &&
      !settings?.accessKeyConfigured &&
      !accessKey.trim()
    ) {
      errors.accessKey = t("azureEmail.validation.accessKeyRequired");
    }
    for (const field of [
      "invitationTextBody",
      "invitationHtmlBody",
      "passwordResetTextBody",
      "passwordResetHtmlBody",
    ] as const) {
      if (!form[field].includes("{UserName}") || !form[field].includes("{ActionUrl}")) {
        errors[field] = t("azureEmail.validation.requiredBodyPlaceholders");
      }
    }
    return errors;
  };

  const handleSave = async () => {
    if (!form) return;
    const validationErrors = validateSettings();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    const secret = form.authenticationMode === "AccessKey" && accessKey
      ? accessKey
      : null;
    setIsSaving(true);
    try {
      const saved = await updateAzureEmailSettings({
        ...form,
        endpoint: form.endpoint.trim(),
        senderAddress: form.senderAddress.trim(),
        accessKey: secret,
      });
      setSettings(saved);
      setForm(payloadFrom(saved));
      setAccessKey("");
      setFieldErrors({});
      toast.success(t("azureEmail.messages.settingsSaved"));
    } catch (error) {
      if (error instanceof AzureEmailApiError && Object.keys(error.fieldErrors).length) {
        setFieldErrors(error.fieldErrors);
      } else {
        toast.error(localizedError(error, t("azureEmail.errors.settingsSaveFailed")));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeChange = (mode: AzureEmailAuthenticationMode) => {
    setForm((current) => current ? { ...current, authenticationMode: mode } : current);
    setFieldErrors((current) => ({ ...current, authenticationMode: undefined, accessKey: undefined }));
    if (mode === "ManagedIdentity") setAccessKey("");
  };

  const handleOpenTestConfirmation = () => {
    const email = recipientEmail.trim();
    if (!isValidEmail(email)) {
      setRecipientError(t("azureEmail.validation.email"));
      return;
    }
    setRecipientEmail(email);
    setRecipientError(undefined);
    setTestDialogOpen(true);
  };

  const handleSendTest = async () => {
    const email = recipientEmail.trim();
    if (!isValidEmail(email)) {
      setRecipientError(t("azureEmail.validation.email"));
      setTestDialogOpen(false);
      return;
    }
    setIsSending(true);
    setRecipientError(undefined);
    try {
      const result = await sendAzureEmailTest({ recipientEmail: email });
      const nextResult: TestResultState = {
        status: result.isSuccess ? "Succeeded" : "Failed",
        checkedAt: result.checkedAt,
        error: result.error,
      };
      setTestResult(nextResult);
      setSettings((current) => current ? {
        ...current,
        lastTestAt: result.checkedAt,
        lastTestStatus: nextResult.status,
        lastTestError: result.error,
        updatedAt: result.updatedAt,
      } : current);
      setTestDialogOpen(false);
      setRecipientEmail("");
      if (result.isSuccess) {
        toast.success(t("azureEmail.messages.testSucceeded"));
      } else {
        toast.error(result.error || t("azureEmail.errors.testFailed"));
      }
    } catch (error) {
      const message = localizedError(error, t("azureEmail.errors.testFailed"));
      const validation = error instanceof AzureEmailApiError
        ? error.fieldErrors
        : {};
      if (validation.recipientEmail) setRecipientError(validation.recipientEmail);
      setTestResult({ status: "Failed", checkedAt: null, error: message });
      setSettings((current) => current ? {
        ...current,
        lastTestStatus: "Failed",
        lastTestError: message,
      } : current);
      setTestDialogOpen(false);
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const safeTestError = currentTest.error &&
    currentTest.error.length < 400 &&
    !/[\r\n]|\bat\s+[\w$.<>]+\s*\(/i.test(currentTest.error)
    ? currentTest.error
    : currentTest.error
      ? t("azureEmail.status.technicalErrorHidden")
      : null;

  const updateForm = <K extends keyof AzureEmailSettingsPayload,>(
    key: K,
    value: AzureEmailSettingsPayload[K],
  ) => {
    setForm((current) => current ? { ...current, [key]: value } : current);
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.titleIcon} aria-hidden="true"><Mail size={19} /></span>
        <div>
          <span className={styles.eyebrow}>{t("settings.groups.integrations")}</span>
          <h1>{t("azureEmail.title")}</h1>
          <p>{t("azureEmail.description")}</p>
        </div>
      </header>

      <nav className={styles.tabs} role="tablist" aria-label={t("azureEmail.navigation.label")}>
        <button type="button" role="tab" id="azure-email-status-tab" aria-controls="azure-email-status-panel"
          aria-selected={activeTab === "status"} className={activeTab === "status" ? styles.activeTab : ""}
          onClick={() => setActiveTab("status")}>
          <Activity size={16} aria-hidden="true" />{t("azureEmail.navigation.status")}
        </button>
        <button type="button" role="tab" id="azure-email-settings-tab" aria-controls="azure-email-settings-panel"
          aria-selected={activeTab === "settings"} className={activeTab === "settings" ? styles.activeTab : ""}
          onClick={() => setActiveTab("settings")}>
          <Settings2 size={16} aria-hidden="true" />{t("azureEmail.navigation.integrationSettings")}
        </button>
        <button type="button" role="tab" id="azure-email-templates-tab" aria-controls="azure-email-templates-panel"
          aria-selected={activeTab === "templates"} className={activeTab === "templates" ? styles.activeTab : ""}
          onClick={() => setActiveTab("templates")}>
          <Mail size={16} aria-hidden="true" />{t("azureEmail.navigation.templates")}
        </button>
      </nav>

      {activeTab === "status" && (
        <section id="azure-email-status-panel" role="tabpanel" aria-labelledby="azure-email-status-tab" className={styles.tabPanel}>
          {settingsLoading && !settings ? (
            <div className={styles.loading} aria-busy="true">{t("common.loading")}</div>
          ) : settingsError && !settings ? (
            <div className={styles.panel} role="alert">
              <p>{t("azureEmail.errors.settingsLoadFailed")}</p>
              <Button variant="secondary" onClick={() => void refreshSettings()}>
                <RefreshCw size={15} aria-hidden="true" />{t("common.refresh")}
              </Button>
            </div>
          ) : settings ? (
            <>
              <section className={styles.panel}>
                <div className={styles.sectionHeader}>
                  <h2><Activity size={17} aria-hidden="true" />{t("azureEmail.status.title")}</h2>
                  <Button variant="secondary" size="small" onClick={() => void refreshSettings()} disabled={settingsLoading}>
                    <RefreshCw size={14} aria-hidden="true" className={settingsLoading ? styles.spinning : undefined} />
                    {t("common.refresh")}
                  </Button>
                </div>
                <div className={styles.statusGrid}>
                  <div className={styles.statusCard}>
                    <span>{t("azureEmail.status.integration")}</span>
                    <strong className={settings.isEnabled ? styles.enabled : styles.disabled}>
                      {settings.isEnabled ? t("azureEmail.status.enabled") : t("azureEmail.status.disabled")}
                    </strong>
                  </div>
                  <div className={styles.statusCard}>
                    <span>{t("azureEmail.status.authentication")}</span>
                    <strong>{t(`azureEmail.authentication.${settings.authenticationMode}`)}</strong>
                  </div>
                  <div className={styles.statusCard}>
                    <span>{t("azureEmail.status.accessKey")}</span>
                    <strong className={settings.accessKeyConfigured ? styles.enabled : styles.disabled}>
                      {settings.accessKeyConfigured ? t("azureEmail.status.configured") : t("azureEmail.status.notConfigured")}
                    </strong>
                  </div>
                  <div className={styles.statusCard}>
                    <span>{t("azureEmail.status.lastTest")}</span>
                    <strong className={`${styles.statusBadge} ${styles[`status_${statusClass[currentTest.status]}`]}`}>
                      <i aria-hidden="true" />{t(`azureEmail.testStatus.${currentTest.status}`)}
                    </strong>
                  </div>
                  <div className={styles.statusCard}>
                    <span>{t("azureEmail.status.lastTestAt")}</span>
                    <strong>{formatDate(currentTest.checkedAt)}</strong>
                  </div>
                  <div className={styles.statusCard}>
                    <span>{t("azureEmail.status.updatedAt")}</span>
                    <strong>{formatDate(settings.updatedAt)}</strong>
                  </div>
                </div>
                {safeTestError && (
                  <div className={styles.inlineError} role="status">
                    <strong>{t("azureEmail.status.lastTestError")}</strong><span>{safeTestError}</span>
                  </div>
                )}
              </section>

              <section className={styles.panel}>
                <div className={styles.sectionHeader}>
                  <h2><Send size={17} aria-hidden="true" />{t("azureEmail.test.title")}</h2>
                </div>
                <p className={styles.realEmailNotice}>{t("azureEmail.test.realEmailNote")}</p>
                <div className={styles.testForm}>
                  <TextField
                    label={t("azureEmail.test.recipient")}
                    type="email"
                    autoComplete="email"
                    value={recipientEmail}
                    onChange={(event) => {
                      setRecipientEmail(event.target.value);
                      setRecipientError(undefined);
                    }}
                    error={Boolean(recipientError)}
                    helperText={recipientError}
                    required
                  />
                  <Button onClick={handleOpenTestConfirmation} disabled={isSending || !settings.isEnabled}>
                    <Send size={15} aria-hidden="true" />
                    {isSending ? t("azureEmail.test.sending") : t("azureEmail.test.send")}
                  </Button>
                </div>
              </section>
            </>
          ) : null}
        </section>
      )}

      {activeTab === "settings" && (
        settingsLoading && !form ? (
          <div id="azure-email-settings-panel" role="tabpanel" aria-labelledby="azure-email-settings-tab" className={styles.loading} aria-busy="true">
            {t("common.loading")}
          </div>
        ) : settingsError && !form ? (
          <section id="azure-email-settings-panel" role="tabpanel" aria-labelledby="azure-email-settings-tab" className={styles.tabPanel}>
            <div className={styles.panel} role="alert">
              <p>{t("azureEmail.errors.settingsLoadFailed")}</p>
              <Button variant="secondary" onClick={() => void refreshSettings()}>
                <RefreshCw size={15} aria-hidden="true" />{t("common.refresh")}
              </Button>
            </div>
          </section>
        ) : form ? (
          <section id="azure-email-settings-panel" role="tabpanel" aria-labelledby="azure-email-settings-tab" className={styles.tabPanel}>
            <section className={styles.panel}>
              <div className={styles.sectionHeader}>
                <h2><Settings2 size={17} aria-hidden="true" />{t("azureEmail.settings.title")}</h2>
              </div>
              <div className={styles.formGrid}>
                <TextField className={styles.wide} label={t("azureEmail.settings.endpoint")} type="url"
                  value={form.endpoint} onChange={(event) => updateForm("endpoint", event.target.value)}
                  error={Boolean(fieldErrors.endpoint)} helperText={fieldErrors.endpoint} required />
                <TextField className={styles.wide} label={t("azureEmail.settings.senderAddress")} type="email"
                  value={form.senderAddress} onChange={(event) => updateForm("senderAddress", event.target.value)}
                  error={Boolean(fieldErrors.senderAddress)} helperText={fieldErrors.senderAddress} required />
                <Select
                  label={t("azureEmail.settings.authenticationMode")}
                  value={form.authenticationMode}
                  onChange={(event) => {
                    const mode = event.target.value;
                    if (mode === "ManagedIdentity" || mode === "AccessKey") {
                      handleModeChange(mode);
                    }
                  }}
                  error={Boolean(fieldErrors.authenticationMode)}
                  helperText={fieldErrors.authenticationMode}
                >
                  <option value="ManagedIdentity">{t("azureEmail.authentication.ManagedIdentity")}</option>
                  <option value="AccessKey">{t("azureEmail.authentication.AccessKey")}</option>
                </Select>
                <div className={styles.authHint}>
                  {form.authenticationMode === "ManagedIdentity"
                    ? t("azureEmail.settings.managedIdentityHint")
                    : settings?.accessKeyConfigured
                      ? t("azureEmail.settings.accessKeyConfiguredHint")
                      : t("azureEmail.settings.accessKeyHint")}
                </div>
                {form.authenticationMode === "AccessKey" && (
                  <TextField className={styles.wide} label={t("azureEmail.settings.accessKey")} type="password"
                    autoComplete="off" value={accessKey} onChange={(event) => {
                      setAccessKey(event.target.value);
                      setFieldErrors((current) => ({ ...current, accessKey: undefined }));
                    }} error={Boolean(fieldErrors.accessKey)} helperText={fieldErrors.accessKey ??
                      (settings?.accessKeyConfigured ? t("azureEmail.settings.accessKeyConfiguredHint") : undefined)} />
                )}
                <div className={styles.enabledControl}>
                  <span>{t("azureEmail.settings.enabled")}</span>
                  <Switch checked={form.isEnabled} label={form.isEnabled
                    ? t("azureEmail.status.enabled")
                    : t("azureEmail.status.disabled")}
                    onCheckedChange={(checked) => updateForm("isEnabled", checked)} />
                </div>
              </div>
              <div className={styles.secretNote} role="note">{t("azureEmail.settings.secretNote")}</div>
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

      {activeTab === "templates" && (
        settingsLoading && !form ? (
          <div id="azure-email-templates-panel" role="tabpanel" aria-labelledby="azure-email-templates-tab" className={styles.loading} aria-busy="true">
            {t("common.loading")}
          </div>
        ) : settingsError && !form ? (
          <section id="azure-email-templates-panel" role="tabpanel" aria-labelledby="azure-email-templates-tab" className={styles.tabPanel}>
            <div className={styles.panel} role="alert">
              <p>{t("azureEmail.errors.settingsLoadFailed")}</p>
              <Button variant="secondary" onClick={() => void refreshSettings()}>
                <RefreshCw size={15} aria-hidden="true" />{t("common.refresh")}
              </Button>
            </div>
          </section>
        ) : form ? (
          <section id="azure-email-templates-panel" role="tabpanel" aria-labelledby="azure-email-templates-tab" className={styles.tabPanel}>
            <nav className={styles.templateTabs} role="tablist" aria-label={t("azureEmail.templates.navigationLabel")}>
              <button type="button" role="tab" id="azure-email-invitation-tab" aria-controls="azure-email-template-editor"
                aria-selected={activeTemplate === "invitation"}
                className={activeTemplate === "invitation" ? styles.activeTemplateTab : ""}
                onClick={() => setActiveTemplate("invitation")}>
                {t("azureEmail.templates.invitationTitle")}
              </button>
              <button type="button" role="tab" id="azure-email-password-reset-tab" aria-controls="azure-email-template-editor"
                aria-selected={activeTemplate === "passwordReset"}
                className={activeTemplate === "passwordReset" ? styles.activeTemplateTab : ""}
                onClick={() => setActiveTemplate("passwordReset")}>
                {t("azureEmail.templates.passwordResetTitle")}
              </button>
            </nav>
            <section id="azure-email-template-editor" role="tabpanel"
              aria-labelledby={activeTemplate === "invitation" ? "azure-email-invitation-tab" : "azure-email-password-reset-tab"}
              className={styles.panel}>
              {activeTemplate === "invitation" ? (
                <TemplateEditor
                  title={t("azureEmail.templates.invitationTitle")}
                  subjectLabel={t("azureEmail.templates.subject")}
                  messageLabel={t("azureEmail.templates.message")}
                  textBodyLabel={t("azureEmail.templates.textBody")}
                  htmlBodyLabel={t("azureEmail.templates.htmlBody")}
                  placeholdersLabel={t("azureEmail.templates.placeholders")}
                  previewLabel={t("azureEmail.templates.preview")}
                  hidePreviewLabel={t("azureEmail.templates.hidePreview")}
                  previewTitle={t("azureEmail.templates.previewTitle")}
                  previewHint={t("azureEmail.templates.previewHint")}
                  placeholders={templatePlaceholders}
                  subject={form.invitationSubject}
                  message={form.invitationMessage}
                  textBody={form.invitationTextBody}
                  htmlBody={form.invitationHtmlBody}
                  fieldErrors={fieldErrors}
                  fieldNames={{
                    subject: "invitationSubject",
                    message: "invitationMessage",
                    textBody: "invitationTextBody",
                    htmlBody: "invitationHtmlBody",
                  }}
                  onChange={(field, value) => updateForm(field, value)}
                />
              ) : (
                <TemplateEditor
                  title={t("azureEmail.templates.passwordResetTitle")}
                  subjectLabel={t("azureEmail.templates.subject")}
                  messageLabel={t("azureEmail.templates.message")}
                  textBodyLabel={t("azureEmail.templates.textBody")}
                  htmlBodyLabel={t("azureEmail.templates.htmlBody")}
                  placeholdersLabel={t("azureEmail.templates.placeholders")}
                  previewLabel={t("azureEmail.templates.preview")}
                  hidePreviewLabel={t("azureEmail.templates.hidePreview")}
                  previewTitle={t("azureEmail.templates.previewTitle")}
                  previewHint={t("azureEmail.templates.previewHint")}
                  placeholders={templatePlaceholders}
                  subject={form.passwordResetSubject}
                  message={form.passwordResetMessage}
                  textBody={form.passwordResetTextBody}
                  htmlBody={form.passwordResetHtmlBody}
                  fieldErrors={fieldErrors}
                  fieldNames={{
                    subject: "passwordResetSubject",
                    message: "passwordResetMessage",
                    textBody: "passwordResetTextBody",
                    htmlBody: "passwordResetHtmlBody",
                  }}
                  onChange={(field, value) => updateForm(field, value)}
                />
              )}
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

      <ConfirmationModal
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        title={t("azureEmail.test.confirmTitle")}
        description={t("azureEmail.test.confirmDescription", { recipient: recipientEmail })}
        confirmText={t("azureEmail.test.confirmSend")}
        confirmVariant="primary"
        confirmIcon={<Send size={15} aria-hidden="true" />}
        confirmLoading={isSending}
        preventClose
        onConfirm={() => void handleSendTest()}
      />
    </main>
  );
};
