import { useState, useMemo, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Dropdown, Button, MultiSelect } from "@/ui-kit";

// stores
import { useAppSelector } from "@/store/hooks";

// types
import type { Vehicle } from "@/types/settings";

// styles
import styles from "./BucketsDropdown.module.css";

interface BucketsDropdownProps {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  vehicle: Vehicle | null;
  onOpenChange: (open: boolean) => void;
  onSave?: (vehicleId: string, bucketIds: number[]) => void;
  isLoading?: boolean;
}

export const BucketsDropdown = ({
  open,
  anchorRef,
  vehicle,
  onOpenChange,
  onSave,
  isLoading = false,
}: BucketsDropdownProps) => {
  const { t } = useTranslation();

  const { catalystBuckets } = useAppSelector((state) => state.catalystBuckets);
  const { vehicleBuckets, isLoading: isVehiclesLoading } = useAppSelector(
    (state) => state.vehicles,
  );

  const [selectedBucketIds, setSelectedBucketIds] = useState<string[]>([]);

  const bucketOptions = useMemo(
    () =>
      catalystBuckets.map((bucket) => ({
        value: String(bucket.id),
        label: bucket.code,
      })),
    [catalystBuckets],
  );

  const sortedBucketOptions = useMemo(() => {
    const selectedSet = new Set(selectedBucketIds);

    return [...bucketOptions].sort((a, b) => {
      const aSelected = selectedSet.has(a.value);
      const bSelected = selectedSet.has(b.value);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      return a.label.localeCompare(b.label, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [bucketOptions, selectedBucketIds]);

  useEffect(() => {
    if (open) {
      const ids = vehicleBuckets?.bucketIds;
      setSelectedBucketIds(Array.isArray(ids) ? ids.map(String) : []);
    }
  }, [open, vehicleBuckets]);

  const hasChanges = useMemo(() => {
    const originalIds = vehicleBuckets?.bucketIds?.map(String) || [];
    if (originalIds.length !== selectedBucketIds.length) return true;

    return !originalIds.every((id) => selectedBucketIds.includes(id));
  }, [vehicleBuckets, selectedBucketIds]);

  const handleSave = () => {
    if (!vehicle) return;

    if (hasChanges) {
      const numericIds = selectedBucketIds.map(Number);
      onSave?.(vehicle.id, numericIds);
    } else {
      onOpenChange(false);
    }
  };

  const isGlobalLoading = isLoading || isVehiclesLoading;

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="end"
      side="bottom"
      title={`${t("catalystBuckets.title")}: ${vehicle?.brand || ""}`}
      contentClassName={styles.dropdownContentOverride}
    >
      <div className={styles.header}>
        <span className={styles.title}>
          {t("catalystBuckets.title")}: {vehicle?.brand}
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.fullRow}>
          {bucketOptions.length > 0 ? (
            <MultiSelect
              searchable
              label={t("catalystBuckets.searchBucket")}
              placeholder={t("catalystBuckets.searchBucket")}
              options={sortedBucketOptions}
              value={selectedBucketIds}
              onChange={setSelectedBucketIds}
              disabled={isGlobalLoading}
              className={styles.multiSelectFullWidth}
            />
          ) : (
            <div className={styles.placeholderWrapper}>
              <span>{t("common.loading")}</span>
            </div>
          )}
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => onOpenChange(false)}
              disabled={isGlobalLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={handleSave}
              disabled={isGlobalLoading || bucketOptions.length === 0}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
