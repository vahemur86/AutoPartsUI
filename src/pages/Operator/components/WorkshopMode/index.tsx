import { useMemo } from "react";
import { Button, Select, Switch, TextField, Textarea } from "@/ui-kit";
import { useTranslation } from "react-i18next";

import sharedStyles from "../../OperatorPage.module.css";
import styles from "./WorkshopMode.module.css";
import type { ServiceTemplate } from "@/services/settings/serviceTemplates";
import type { WorkshopFormData } from "@/types/operator";

interface WorkshopModeProps {
  serviceTemplates: ServiceTemplate[];
  serviceTemplatesLoading: boolean;
  formData: WorkshopFormData;
  setFormData: React.Dispatch<React.SetStateAction<WorkshopFormData>>;
  onSubmit: () => void;
  isSubmitting: boolean;
  hasTriedSubmit: boolean;
  totalPrice: number;
}

const isPriceValid = (value: string) => {
  return value.trim() !== "" && !Number.isNaN(Number(value));
};

export const WorkshopMode = ({
  serviceTemplates,
  serviceTemplatesLoading,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  hasTriedSubmit,
  totalPrice,
}: WorkshopModeProps) => {
  const { t } = useTranslation();

  const selectedTemplate = useMemo(
    () =>
      serviceTemplates.find(
        (item) => String(item.id) === formData.selectedTemplateId,
      ) ?? null,
    [serviceTemplates, formData.selectedTemplateId],
  );

  const isSubmitDisabled = useMemo(() => {
    if (formData.isManualMode) {
      return (
        !isPriceValid(formData.mechanicPrice) ||
        !isPriceValid(formData.electricianPrice) ||
        !isPriceValid(formData.sparePartsPrice)
      );
    }

    return !selectedTemplate;
  }, [formData, selectedTemplate]);

  return (
    <div className={styles.workshopCard}>
      <h2 className={sharedStyles.cardTitle}>{t("operatorPage.workshop.title")}</h2>
      <div className={sharedStyles.divider} />

      <div className={styles.modeRow}>
        <div className={styles.modeLabel}>
          {t("operatorPage.workshop.modeLabel")}
        </div>
        <div className={styles.switchRow}>
          <span
            className={
              !formData.isManualMode ? styles.modeOptionActive : styles.modeOption
            }
          >
            {t("operatorPage.workshop.templateMode")}
          </span>
          <Switch
            checked={formData.isManualMode}
            onCheckedChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                isManualMode: value,
                selectedTemplateId: value ? "" : prev.selectedTemplateId,
              }))
            }
          />
          <span
            className={
              formData.isManualMode ? styles.modeOptionActive : styles.modeOption
            }
          >
            {t("operatorPage.workshop.manualMode")}
          </span>
        </div>
      </div>

      {!formData.isManualMode ? (
        <div className={styles.fieldBlock}>
          <Select
            label={t("operatorPage.workshop.templateLabel")}
            value={formData.selectedTemplateId}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                selectedTemplateId: e.target.value,
              }))
            }
            searchable
            searchPlaceholder={t("common.search")}
            placeholder={t("operatorPage.workshop.selectTemplatePlaceholder")}
            error={hasTriedSubmit && !formData.selectedTemplateId}
            disabled={serviceTemplatesLoading}
          >
            {serviceTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>

          <div className={styles.readOnlyPrices}>
            <TextField
              label={t("operatorPage.workshop.mechanicPrice")}
              value={selectedTemplate ? String(selectedTemplate.mechanicPrice) : ""}
              disabled
            />
            <TextField
              label={t("operatorPage.workshop.electricianPrice")}
              value={selectedTemplate ? String(selectedTemplate.electricianPrice) : ""}
              disabled
            />
            <TextField
              label={t("operatorPage.workshop.sparePartsPrice")}
              value={selectedTemplate ? String(selectedTemplate.sparePartsPrice) : ""}
              disabled
            />
          </div>
        </div>
      ) : (
        <div className={styles.fieldBlock}>
          <TextField
            label={t("operatorPage.workshop.mechanicPrice")}
            type="text"
            inputMode="decimal"
            value={formData.mechanicPrice}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                mechanicPrice: e.target.value,
              }))
            }
            error={hasTriedSubmit && !isPriceValid(formData.mechanicPrice)}
            placeholder="0.00"
          />
          <TextField
            label={t("operatorPage.workshop.electricianPrice")}
            type="text"
            inputMode="decimal"
            value={formData.electricianPrice}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                electricianPrice: e.target.value,
              }))
            }
            error={hasTriedSubmit && !isPriceValid(formData.electricianPrice)}
            placeholder="0.00"
          />
          <TextField
            label={t("operatorPage.workshop.sparePartsPrice")}
            type="text"
            inputMode="decimal"
            value={formData.sparePartsPrice}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                sparePartsPrice: e.target.value,
              }))
            }
            error={hasTriedSubmit && !isPriceValid(formData.sparePartsPrice)}
            placeholder="0.00"
          />
        </div>
      )}

      <div className={styles.fieldBlock}>
        <Textarea
          label={t("operatorPage.workshop.commentLabel")}
          value={formData.comment}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, comment: e.target.value }))
          }
          placeholder={t("operatorPage.workshop.commentPlaceholder")}
          rows={5}
        />
      </div>

      <div className={styles.summaryRow}>
        <div>
          <div className={styles.summaryLabel}>
            {t("operatorPage.workshop.totalAmount")}
          </div>
          <div className={styles.summaryValue}>
            {totalPrice.toLocaleString()} AMD
          </div>
        </div>
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={isSubmitting || isSubmitDisabled}
          className={styles.submitButton}
        >
          {t("operatorPage.workshop.createOrder")}
        </Button>
      </div>
    </div>
  );
};
