import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  type FC,
} from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { DataTable, IconButton, TextField } from "@/ui-kit";

// icons
import { Plus, Search, X } from "lucide-react";

// components
import {
  CatalystBucketDropdown,
  type CatalystBucketForm,
} from "./catalystBucketActions/CatalystBucketDropdown";

// columns
import { getCatalystBucketColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addCatalystBucket,
  fetchCatalystBuckets,
  editCatalystBucket,
  fetchCatalystBucketsByCode,
} from "@/store/slices/catalystBucketsSlice";

// types
import type { CatalystBucket } from "@/types/settings";

// styles
import styles from "./CatalystBuckets.module.css";

interface CatalystBucketsProps {
  withEdit?: boolean;
}

export const CatalystBuckets: FC<CatalystBucketsProps> = ({
  withEdit = true,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Connect to Redux state
  const {
    catalystBuckets,
    isLoading,
    error: apiError,
  } = useAppSelector((state) => state.catalystBuckets);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeBucket, setActiveBucket] = useState<CatalystBucket | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasActiveSearch, setHasActiveSearch] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dispatch(fetchCatalystBuckets());
  }, [dispatch]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setHasActiveSearch(false);
    dispatch(fetchCatalystBuckets()); 
  }, [dispatch]);

  const handleSearch = useCallback(async () => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      handleClearSearch();
      return;
    }

    try {
      await dispatch(fetchCatalystBucketsByCode(trimmedQuery)).unwrap();
      setHasActiveSearch(true);
    } catch (error) {
      console.error("Search failed:", error);
    }
  }, [searchQuery, dispatch, handleClearSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleOpenAdd = useCallback((e: React.MouseEvent<HTMLElement>) => {
    anchorRef.current = e.currentTarget;
    setActiveBucket(null);
    setIsDropdownOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    (bucket: CatalystBucket, e: React.MouseEvent<HTMLElement>) => {
      anchorRef.current = e.currentTarget;
      setActiveBucket(bucket);
      setIsDropdownOpen(true);
    },
    [],
  );

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const handleSaveBucket = useCallback(
    async (data: CatalystBucketForm) => {
      try {
        setIsMutating(true);
        if (activeBucket) {
          await dispatch(
            editCatalystBucket({
              id: activeBucket.id,
              isActive: activeBucket.isActive ?? false,
              ...data,
            }),
          ).unwrap();
        } else {
          await dispatch(addCatalystBucket(data)).unwrap();
        }

        handleClearSearch();
        handleCloseDropdown();
      } catch (error) {
        console.error("Failed to save catalyst bucket:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, activeBucket, handleCloseDropdown, handleClearSearch],
  );


  const columns = useMemo(
    () =>
      getCatalystBucketColumns({
        withEdit,
        onEdit: handleOpenEdit,
      }),
    [withEdit, handleOpenEdit],
  );

  return (
    <div className={styles.catalystBucketsWrapper}>
      <div className={styles.catalystBucketsHeader}>
        <div className={styles.searchBucketWrapper}>
          <TextField
            placeholder={t("catalystBuckets.searchBucket")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value.trim() && hasActiveSearch)
                handleClearSearch();
            }}
            onKeyDown={handleKeyDown}
            error={!!apiError && hasActiveSearch}
            helperText={hasActiveSearch && apiError ? apiError : ""}
            disabled={isLoading}
            icon={
              hasActiveSearch ? (
                <X
                  size={16}
                  onClick={handleClearSearch}
                  className={styles.clickableIcon}
                />
              ) : (
                <Search
                  size={16}
                  onClick={handleSearch}
                  className={styles.clickableIcon}
                />
              )
            }
          />
        </div>

        <div className={styles.addBucketButtonWrapper}>
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel={t("catalystBuckets.ariaLabels.addNewBucket")}
            className={styles.plusButton}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>
            {t("catalystBuckets.addBucket")}
          </span>
        </div>
      </div>

      {/* Mobile Add Button */}
      <div className={styles.addBucketButtonMobile}>
        <div className={styles.addBucketButtonWrapperMobile}>
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} />}
            ariaLabel={t("catalystBuckets.ariaLabels.addNewBucket")}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>
            {t("catalystBuckets.addBucket")}
          </span>
        </div>
      </div>

      <CatalystBucketDropdown
        open={isDropdownOpen}
        anchorRef={anchorRef}
        initialData={activeBucket}
        isLoading={isMutating}
        onOpenChange={(open) => !open && handleCloseDropdown()}
        onSave={handleSaveBucket}
      />

      <div className={styles.tableWrapper}>
        <DataTable data={catalystBuckets} columns={columns} pageSize={7} />
      </div>
    </div>
  );
};
