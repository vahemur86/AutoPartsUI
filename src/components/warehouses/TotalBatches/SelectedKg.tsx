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
  onKgChange: (id: number, val: number) => void;
  onAdd: (id: number, val: number) => void;
}> = ({
  inventoryLotId,
  initialValue,
  disabled = false,
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
    }
  }, [initialValue]);

  const numericValue = parseFloat(localValue) || 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);

    const numericVal = parseFloat(val);
    onKgChange(inventoryLotId, isNaN(numericVal) ? 0 : numericVal);
  };

  const handleAddClick = () => {
    if (numericValue > 0) {
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
