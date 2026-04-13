import { useEffect, useState, type FC } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { TextField, Button } from "@/ui-kit";

// styles
import styles from "./TotalBatches.module.css";

export const SelectedKgCell: FC<{
  inventoryLotId: number;
  initialValue: number | undefined;
  disabled?: boolean;
  maxKg: number;
  onKgChange: (id: number, val: number) => void;
  onAdd: (id: number, val: number) => void;
}> = ({
  inventoryLotId,
  initialValue,
  disabled = false,
  maxKg,
  onKgChange,
  onAdd,
}) => {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState<string>(
    initialValue !== undefined && initialValue !== 0
      ? initialValue.toString()
      : "",
  );

  useEffect(() => {
    if (initialValue === 0 || initialValue === undefined) {
      setLocalValue("");
    } else {
      setLocalValue(initialValue.toString());
    }
  }, [initialValue]);

  const numericValue = parseFloat(localValue) || 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (val === "") {
      setLocalValue("");
      onKgChange(inventoryLotId, 0);
      return;
    }

    let numericVal = parseFloat(val);

    if (isNaN(numericVal)) return;

    // 🚨 LIMIT HERE
    if (numericVal > maxKg) {
      numericVal = maxKg;
      val = maxKg.toString();
    }

    setLocalValue(val);
    onKgChange(inventoryLotId, numericVal);
  };

  const handleAddClick = () => {
    if (numericValue > 0 && numericValue <= maxKg) {
      onAdd(inventoryLotId, numericValue);
    }
  };

  return (
    <div className={styles.selectedKgCellContainer}>
      <div className={styles.selectedKgInput}>
        <TextField
          type="number"
          value={localValue}
          disabled={disabled}
          onChange={handleChange}
          placeholder="0"
          min="0"
          step="0.01"
          max={maxKg}
          className={styles.kgInput}
        />
      </div>

      <Button
        variant="primary"
        size="small"
        onClick={handleAddClick}
        disabled={disabled || numericValue <= 0}
      >
        {t("common.add")}
      </Button>
    </div>
  );
};
