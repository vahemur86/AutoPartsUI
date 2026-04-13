import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  type FC,
} from "react";

// ui-kit
import { DataTable } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// styles
import styles from "./CatalystPricing.module.css";

// redux
import {
  editCatalystPricing,
  fetchCatalystPricing,
} from "@/store/slices/catalystPricingSlice";

import { getCatalystPricingColumns } from "./columns";
import { CatalystPricingDropdown } from "./catalystPricingActions/CatalystPricingDropdown";
import type { CatalystPricing } from "@/types/settings";

export const CatalystPricings: FC = () => {
  const dispatch = useAppDispatch();

  const { prices } = useAppSelector((state) => state.catalystPricing);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeRate, setActiveRate] = useState<CatalystPricing | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dispatch(fetchCatalystPricing(1));
  }, [dispatch]);

  const handleOpenEdit = useCallback(
    (rate: CatalystPricing, e: React.MouseEvent<HTMLElement>) => {
      anchorRef.current = e.currentTarget;
      setActiveRate(rate);
      setIsDropdownOpen(true);
    },
    [],
  );

  const handleSaveRate = useCallback(
    async (data: CatalystPricing) => {
      try {
        setIsMutating(true);
        await dispatch(editCatalystPricing(data)).unwrap();
        await dispatch(fetchCatalystPricing(1)).unwrap();
        setIsDropdownOpen(false);
      } catch (error) {
        console.error("Failed to save:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch],
  );

  const tableData = useMemo(() => {
    return prices ? [prices] : [];
  }, [prices]);

  const columns = useMemo(
    () => getCatalystPricingColumns({ onEdit: handleOpenEdit }),
    [handleOpenEdit],
  );

  return (
    <div className={styles.catalystPricingWrapper}>
      <CatalystPricingDropdown
        open={isDropdownOpen}
        anchorRef={anchorRef}
        initialData={activeRate}
        isLoading={isMutating}
        onOpenChange={setIsDropdownOpen}
        onSave={handleSaveRate}
      />

      <div className={styles.tableWrapper}>
        <DataTable data={tableData} columns={columns} pageSize={1} />
      </div>
    </div>
  );
};
