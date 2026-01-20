import { useMemo, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tab, TabGroup, Button, TextField, Select, DataTable } from "@/ui-kit";
import { LANGUAGES } from "@/constants/settings";
import styles from "./Translation.module.css";
import { getTranslationColumns } from "./columns";
import {
  createTranslation,
  getTranslations,
  type LocalizedText,
} from "@/services/settings/translations";

type TranslationTab = "add-new" | "translation-history";

type TranslationForm = {
  entityName: string;
  entityId: string;
  fieldName: string;
  fieldValue: string;
  languageCode: string;
};

export type TranslationHistoryItem = {
  entityName: string;
  entityId: number;
  fieldName: string;
  languageCode: string;
  value: string;
};

const initialForm: TranslationForm = {
  entityName: "",
  entityId: "",
  fieldName: "",
  fieldValue: "",
  languageCode: "",
};

export const Translation = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TranslationTab>("add-new");
  const [form, setForm] = useState<TranslationForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [translations, setTranslations] = useState<LocalizedText[]>([]);

  const tabs = useMemo(
    () =>
      [
        { id: "add-new", label: t("translation.tabs.addNew") },
        { id: "translation-history", label: t("translation.tabs.history") },
      ] as const,
    [t]
  );

  const fetchTranslations = useCallback(async () => {
    try {
      const data = await getTranslations();
      setTranslations(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch translations:", error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "translation-history") {
      fetchTranslations();
    }
  }, [activeTab, fetchTranslations]);

  const translationHistoryData: TranslationHistoryItem[] = useMemo(
    () =>
      translations.map((translation) => ({
        entityName: translation.entityName,
        entityId: translation.entityId,
        fieldName: translation.fieldName,
        languageCode: translation.languageCode,
        value: translation.value,
      })),
    [translations]
  );

  const columns = useMemo(() => getTranslationColumns(), []);

  const updateField = useCallback(
    <K extends keyof TranslationForm>(key: K, value: TranslationForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetForm = useCallback(() => setForm(initialForm), []);

  const isValid =
    form.entityName.trim() &&
    form.entityId.trim() &&
    form.fieldName.trim() &&
    form.fieldValue.trim() &&
    form.languageCode.trim();

  const handleCancel = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleAdd = useCallback(async () => {
    if (!isValid || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const entityIdNumber = parseInt(form.entityId.trim(), 10);
      if (isNaN(entityIdNumber)) {
        throw new Error("Entity ID must be a valid number");
      }

      await createTranslation({
        entityName: form.entityName.trim(),
        entityId: entityIdNumber,
        fieldName: form.fieldName.trim(),
        value: form.fieldValue.trim(),
        languageCode: form.languageCode.trim(),
      });

      resetForm();
      if (activeTab === "translation-history") {
        await fetchTranslations();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, isSubmitting, isValid, resetForm, activeTab, fetchTranslations]);

  return (
    <section className={styles.translationWrapper}>
      <div className={styles.translation}>
        <nav
          className={styles.tabsContainer}
          aria-label={t("translation.ariaLabel")}
        >
          <TabGroup variant="segmented">
            {tabs.map(({ id, label }) => (
              <Tab
                key={id}
                variant="segmented"
                active={activeTab === id}
                text={label}
                onClick={() => setActiveTab(id)}
              />
            ))}
          </TabGroup>
        </nav>

        {activeTab === "add-new" && (
          <div className={styles.formContainer}>
            <div className={styles.formRow}>
              <TextField
                label={t("translation.form.entityName")}
                placeholder={t("translation.form.type")}
                value={form.entityName}
                onChange={(e) => updateField("entityName", e.target.value)}
              />

              <TextField
                label={t("translation.form.entityId")}
                placeholder={t("translation.form.type")}
                value={form.entityId}
                onChange={(e) => updateField("entityId", e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <TextField
                label={t("translation.form.fieldName")}
                placeholder={t("translation.form.type")}
                value={form.fieldName}
                onChange={(e) => updateField("fieldName", e.target.value)}
              />

              <TextField
                label={t("translation.form.fieldValue")}
                placeholder={t("translation.form.type")}
                value={form.fieldValue}
                onChange={(e) => updateField("fieldValue", e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <Select
                label={t("translation.form.languageCode")}
                placeholder={t("translation.form.select")}
                value={form.languageCode}
                onChange={(e) => updateField("languageCode", e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code})
                  </option>
                ))}
              </Select>

              {/* keep grid symmetry on desktop */}
              <div className={styles.formSpacer} />
            </div>
          </div>
        )}

        {activeTab === "translation-history" && (
          <div className={styles.historyContainer}>
            <DataTable
              data={translationHistoryData}
              columns={columns}
              pageSize={10}
            />
          </div>
        )}
      </div>

      {activeTab === "add-new" && (
        <div className={styles.actionButtons}>
          <Button variant="secondary" size="medium" onClick={handleCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={handleAdd}
            disabled={!isValid || isSubmitting}
          >
            {t("common.add")}
          </Button>
        </div>
      )}
    </section>
  );
};
