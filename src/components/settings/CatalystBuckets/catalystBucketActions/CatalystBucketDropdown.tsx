import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dropdown, TextField, Switch } from "@/ui-kit";
import styles from "./CatalystBucketDropdown.module.css";

export interface CatalystBucketForm {
  code: string;
  ptWeight: number;
  pdWeight: number;
  rhWeight: number;
  isActive?: boolean;
}

interface CatalystBucketDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  initialData?: (CatalystBucketForm & { id?: string | number }) | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CatalystBucketForm) => void;
}

export const CatalystBucketDropdown = ({
  open,
  anchorRef,
  initialData,
  isLoading = false,
  onOpenChange,
  onSave,
}: CatalystBucketDropdownProps) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [ptWeightInput, setPtWeightInput] = useState("");
  const [pdWeightInput, setPdWeightInput] = useState("");
  const [rhWeightInput, setRhWeightInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (open) {
      setCode(initialData?.code ?? "");
      setPtWeightInput(initialData ? String(initialData.ptWeight) : "");
      setPdWeightInput(initialData ? String(initialData.pdWeight) : "");
      setRhWeightInput(initialData ? String(initialData.rhWeight) : "");
      setIsActive(initialData?.isActive ?? true);
      setHasTriedSave(false);
    }
  }, [open, initialData]);

  // Validation Logic
  const numericPtWeight = parseFloat(ptWeightInput);
  const numericPdWeight = parseFloat(pdWeightInput);
  const numericRhWeight = parseFloat(rhWeightInput);
  const isCodeValid = code.trim().length > 0;
  const areWeightsValid =
    !isNaN(numericPtWeight) &&
    !isNaN(numericPdWeight) &&
    !isNaN(numericRhWeight);
  const isValid = isCodeValid && areWeightsValid;

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      code: code.trim(),
      ptWeight: numericPtWeight,
      pdWeight: numericPdWeight,
      rhWeight: numericRhWeight,
      isActive,
    });
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={
        isEditMode
          ? t("catalystBuckets.editBucket")
          : t("catalystBuckets.addBucket")
      }
    >
      <div className={styles.header}>
        <span className={styles.title}>
          {isEditMode
            ? t("catalystBuckets.editBucket")
            : t("catalystBuckets.addBucket")}
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          <TextField
            label={t("catalystBuckets.form.code")}
            placeholder={t("catalystBuckets.form.enterCode")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={hasTriedSave && !isCodeValid}
            disabled={isLoading}
          />

          <TextField
            label={t("catalystBuckets.form.ptWeight")}
            placeholder="0.00"
            type="number"
            value={ptWeightInput}
            onChange={(e) => setPtWeightInput(e.target.value)}
            error={hasTriedSave && isNaN(numericPtWeight)}
            disabled={isLoading}
          />

          <TextField
            label={t("catalystBuckets.form.pdWeight")}
            placeholder="0.00"
            type="number"
            value={pdWeightInput}
            onChange={(e) => setPdWeightInput(e.target.value)}
            error={hasTriedSave && isNaN(numericPdWeight)}
            disabled={isLoading}
          />

          <TextField
            label={t("catalystBuckets.form.rhWeight")}
            placeholder="0.00"
            type="number"
            value={rhWeightInput}
            onChange={(e) => setRhWeightInput(e.target.value)}
            error={hasTriedSave && isNaN(numericRhWeight)}
            disabled={isLoading}
          />

          <div className={styles.switchWrapper}>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              label={t("catalystBuckets.form.enabled")}
            />
          </div>
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={handleSaveClick}
              disabled={isLoading}
            >
              {isEditMode ? t("common.update") : t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
