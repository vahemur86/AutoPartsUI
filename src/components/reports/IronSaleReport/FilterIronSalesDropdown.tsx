import {
  useState,
  useMemo,
  type FC,
  type RefObject,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, TextField } from "@/ui-kit";

// styles
import styles from "./FilterIronSalesDropdown.module.css";

interface FilterIronSalesDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (filters: { customerId: number | null }) => void;
}

export const FilterIronSalesDropdown: FC<FilterIronSalesDropdownProps> = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
}) => {
  const { t } = useTranslation();

  const [tempValues, setTempValues] = useState({
    customerId: null as number | null,
  });

  const isFiltersEmpty = useMemo(() => {
    return !tempValues.customerId;
  }, [tempValues]);

  const handleIntegerOnlyKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (["e", "E", ".", ","].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleApply = () => {
    if (isFiltersEmpty) return;
    onSave({
      customerId: tempValues.customerId,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    if (isFiltersEmpty) return;
    const emptyState = {
      customerId: null,
    };
    setTempValues(emptyState);
    onSave(emptyState);
    onOpenChange(false);
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={t("common.filters")}
      contentClassName={styles.dropdownContentOverride}
    >
      <div className={styles.header}>
        <span className={styles.title}>{t("common.filters")}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.fieldWrapper}>
          <TextField
            label={t("reports.ironSale.filters.customerId")}
            type="number"
            value={tempValues.customerId ?? ""}
            onKeyDown={handleIntegerOnlyKeyDown}
            onChange={(e) => {
              const val = e.target.value;
              setTempValues((p) => ({
                ...p,
                customerId: val ? Math.floor(Number(val)) : null,
              }));
            }}
          />
        </div>

        <div className={styles.primaryActions}>
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={isFiltersEmpty}
          >
            {t("common.reset")}
          </Button>

          <Button
            variant="primary"
            onClick={handleApply}
            disabled={isFiltersEmpty}
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Dropdown>
  );
};

