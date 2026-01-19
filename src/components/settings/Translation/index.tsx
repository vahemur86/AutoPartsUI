import { useMemo, useState, useCallback } from "react";
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
  const [activeTab, setActiveTab] = useState<TranslationTab>("add-new");
  const [form, setForm] = useState<TranslationForm>(initialForm);

  const tabs = useMemo(
    () =>
      [
        { id: "add-new", label: "Add New Translation" },
        { id: "translation-history", label: "Translation History" },
      ] as const,
    []
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
        <nav className={styles.tabsContainer} aria-label="Translation sections">
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
                label="Entity name"
                placeholder="Type"
                value={form.entityName}
                onChange={(e) => updateField("entityName", e.target.value)}
              />

              <TextField
                label="Entity ID"
                placeholder="Type"
                value={form.entityId}
                onChange={(e) => updateField("entityId", e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <TextField
                label="Field name"
                placeholder="Type"
                value={form.fieldName}
                onChange={(e) => updateField("fieldName", e.target.value)}
              />

              <TextField
                label="Field value"
                placeholder="Type"
                value={form.fieldValue}
                onChange={(e) => updateField("fieldValue", e.target.value)}
              />
            </div>

            <div className={styles.formRow}>
              <Select
                label="Language code"
                placeholder="Select"
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
            Cancel
          </Button>
          <Button variant="primary" size="medium" onClick={handleAdd}>
            Add
          </Button>
        </div>
      )}
    </section>
  );
};
