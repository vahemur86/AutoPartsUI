import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dropdown, TextField, Switch } from "@/ui-kit";
import styles from "./TaskDropdown.module.css";

export interface TaskForm {
  code: string;
  laborCost: number;
  isActive?: boolean;
}

interface TaskDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  initialData?: (TaskForm & { id?: string | number }) | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TaskForm) => void;
}

export const TaskDropdown = ({
  open,
  anchorRef,
  initialData,
  isLoading = false,
  onOpenChange,
  onSave,
}: TaskDropdownProps) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [laborCostInput, setLaborCostInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const isEditMode = !!initialData;

  // Sync state with initialData when opened or when initialData changes
  useEffect(() => {
    if (open) {
      setCode(initialData?.code ?? "");
      setLaborCostInput(initialData ? String(initialData.laborCost) : "");
      setIsActive(initialData?.isActive ?? true);
      setHasTriedSave(false);
    }
  }, [open, initialData]);

  // Validation Logic
  const numericLaborCost = parseFloat(laborCostInput);
  const isCodeValid = code.trim().length > 0;
  const isCostValid = !isNaN(numericLaborCost) && numericLaborCost >= 0;
  const isValid = isCodeValid && isCostValid;

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      code: code.trim(),
      laborCost: numericLaborCost,
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
      title={isEditMode ? t("vehicles.tasks.editTask") : t("vehicles.tasks.addTask")}
    >
      <div className={styles.header}>
        <span className={styles.title}>
          {isEditMode ? t("vehicles.tasks.editTask") : t("vehicles.tasks.addTask")}
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          <TextField
            label={t("vehicles.tasks.form.taskService")}
            placeholder={t("vehicles.tasks.form.enterTaskName")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={hasTriedSave && !isCodeValid}
            helperText={
              hasTriedSave && !isCodeValid ? t("vehicles.tasks.form.taskNameRequired") : ""
            }
            disabled={isLoading}
          />

          <TextField
            label={t("vehicles.tasks.form.laborCost")}
            placeholder="0.00"
            type="number"
            value={laborCostInput}
            onChange={(e) => setLaborCostInput(e.target.value)}
            error={hasTriedSave && !isCostValid}
            helperText={
              hasTriedSave && !isCostValid ? t("vehicles.tasks.form.enterValidCost") : ""
            }
            disabled={isLoading}
          />

          {isEditMode && (
            <div className={styles.switchWrapper}>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                label={t("vehicles.tasks.form.enabled")}
              />
            </div>
          )}
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
