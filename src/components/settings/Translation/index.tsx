import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Tab, TabGroup, Button, TextField, Select, DataTable } from "@/ui-kit";
import { LANGUAGES } from "@/constants/settings";
import styles from "./Translation.module.css";
import { getTranslationColumns } from "./columns";

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
  entityId: string;
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

  const tabs = useMemo(
    () =>
      [
        { id: "add-new", label: t("translation.tabs.addNew") },
        { id: "translation-history", label: t("translation.tabs.history") },
      ] as const,
    [t]
  );

  const translationHistoryData: TranslationHistoryItem[] = useMemo(
    () => [
      {
        entityName: "Product",
        entityId: "12345",
        fieldName: "name",
        languageCode: "en",
        value: "Product Name",
      },
      {
        entityName: "Category",
        entityId: "67890",
        fieldName: "description",
        languageCode: "ru",
        value: "Описание категории",
      },
      {
        entityName: "Brand",
        entityId: "11111",
        fieldName: "title",
        languageCode: "am",
        value: "Անվանում",
      },
    ],
    []
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

  const handleAdd = useCallback(() => {
    if (!isValid) return;

    // TODO: call API
    console.log("Add translation:", {
      entityName: form.entityName.trim(),
      entityId: form.entityId.trim(),
      fieldName: form.fieldName.trim(),
      fieldValue: form.fieldValue.trim(),
      languageCode: form.languageCode.trim(),
    });

    resetForm();
  }, [form, isValid, resetForm]);

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
          <Button variant="primary" size="medium" onClick={handleAdd}>
            {t("common.add")}
          </Button>
        </div>
      )}
    </section>
  );
};
