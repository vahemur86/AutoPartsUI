import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  type FC,
} from "react";
import { toast } from "react-toastify";
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

// utils
import { getErrorMessage } from "@/utils";

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

  // Selectors from Redux
  const { catalystBuckets } = useAppSelector((state) => state.catalystBuckets);

  // Local UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeBucket, setActiveBucket] = useState<CatalystBucket | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    dispatch(fetchCatalystBuckets());
  }, [dispatch]);

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

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchError(null);
    setIsFiltered(false);
    dispatch(fetchCatalystBuckets());
  }, [dispatch]);

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
          toast.success(t("catalystBuckets.success.bucketUpdated"));
        } else {
          await dispatch(addCatalystBucket(data)).unwrap();
          toast.success(t("catalystBuckets.success.bucketCreated"));
        }

        // Refresh based on current search state
        if (isFiltered && searchQuery) {
          await dispatch(fetchCatalystBucketsByCode(searchQuery)).unwrap();
        } else {
          await dispatch(fetchCatalystBuckets()).unwrap();
        }

        handleCloseDropdown();
      } catch (error) {
        toast.error(
          getErrorMessage(error, t("catalystBuckets.error.failedToSave")),
        );
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, activeBucket, handleCloseDropdown, isFiltered, searchQuery, t],
  );

  /**
   * Performs the API-based search using fetchCatalystBucketsByCode
   */
  const handleSearch = useCallback(async () => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      handleClearSearch();
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      const results = await dispatch(
        fetchCatalystBucketsByCode(trimmedQuery),
      ).unwrap();

      setIsFiltered(true);

      if (results.length === 0) {
        setSearchError(t("catalystBuckets.search.notFound"));
      }
    } catch {
      setSearchError(t("catalystBuckets.search.error"));
    } finally {
      setIsSearching(false);
    }
  }, [dispatch, handleClearSearch, searchQuery, t]);

  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      setSearchError(null);

      if (!value.trim() && isFiltered) {
        handleClearSearch();
      }
    },
    [handleClearSearch, isFiltered],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch],
  );

  const columns = useMemo(
    () => getCatalystBucketColumns({ withEdit, onEdit: handleOpenEdit }),
    [withEdit, handleOpenEdit],
  );

  return (
    <div className={styles.catalystBucketsWrapper}>
      <div className={styles.catalystBucketsHeader}>
        <div className={styles.searchBucketWrapper}>
          <TextField
            placeholder={t("catalystBuckets.searchBucket")}
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyDown={handleKeyDown}
            error={!!searchError}
            helperText={searchError || ""}
            disabled={isSearching}
            icon={
              isFiltered || searchQuery ? (
                <X
                  size={16}
                  onClick={handleClearSearch}
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <Search
                  size={16}
                  onClick={handleSearch}
                  style={{ cursor: isSearching ? "wait" : "pointer" }}
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
        onOpenChange={(open) => {
          if (!open) handleCloseDropdown();
        }}
        onSave={handleSaveBucket}
      />

      <div className={styles.tableWrapper}>
        <DataTable data={catalystBuckets} columns={columns} pageSize={7} />
      </div>
    </div>
  );
};
