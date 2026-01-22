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
} from "@/store/slices/catalystBucketsSlice";
// services
import { getSingleCatalystBucket } from "@/services/settings/catalystBuckets";
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
  const { catalystBuckets } = useAppSelector((state) => state.catalystBuckets);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeBucket, setActiveBucket] = useState<CatalystBucket | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchedBucket, setSearchedBucket] = useState<CatalystBucket | null>(
    null
  );
  const [searchError, setSearchError] = useState<string | null>(null);

  const anchorRef = useRef<HTMLElement | null>(null);

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
    []
  );

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const clearSearchState = useCallback(() => {
    setSearchedBucket(null);
    setSearchQuery("");
    setSearchError(null);
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
            })
          ).unwrap();
        } else {
          await dispatch(addCatalystBucket(data)).unwrap();
        }

        await dispatch(fetchCatalystBuckets()).unwrap();
        handleCloseDropdown();
        clearSearchState();
      } catch (error) {
        console.error("Failed to save catalyst bucket:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, activeBucket, handleCloseDropdown, clearSearchState]
  );

  const findLocalBucket = useCallback(
    (query: string) => {
      return catalystBuckets.find(
        (bucket) => bucket.code.toLowerCase() === query.toLowerCase()
      );
    },
    [catalystBuckets]
  );

  const handleSearch = useCallback(async () => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      clearSearchState();
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      // Check local buckets first
      const matchingBucket = findLocalBucket(trimmedQuery);
      if (matchingBucket) {
        setSearchedBucket(matchingBucket);
        return;
      }

      // Fetch from API if not found locally
      const result = await getSingleCatalystBucket(trimmedQuery);

      if (result?.code) {
        const bucketFromQuote: CatalystBucket = {
          id: result.id || 0,
          code: result.code,
          weight: result.weight || 0,
          ptWeight: result.ptWeight || 0,
          pdWeight: result.pdWeight || 0,
          rhWeight: result.rhWeight || 0,
          isActive: result.isActive ?? true,
        };
        setSearchedBucket(bucketFromQuote);
      } else {
        // Check again in case catalystBuckets was updated
        const updatedBucket = findLocalBucket(trimmedQuery);
        if (updatedBucket) {
          setSearchedBucket(updatedBucket);
        } else {
          setSearchError(t("catalystBuckets.search.notFound"));
          setSearchedBucket(null);
        }
      }
    } catch (error) {
      console.error("Failed to search catalyst bucket:", error);
      setSearchError(t("catalystBuckets.search.error"));
      setSearchedBucket(null);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, findLocalBucket, clearSearchState, t]);

  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      setSearchError(null);

      // Clear search results when input is cleared
      if (!value.trim()) {
        setSearchedBucket(null);
        setSearchError(null);
      }
    },
    []
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchedBucket(null);
    setSearchError(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const tableData = useMemo(
    () => (searchedBucket ? [searchedBucket] : catalystBuckets),
    [searchedBucket, catalystBuckets]
  );

  const columns = useMemo(
    () => getCatalystBucketColumns(withEdit, handleOpenEdit),
    [withEdit, handleOpenEdit]
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
              searchedBucket ? (
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
        <DataTable
          enableSelection
          data={tableData}
          columns={columns}
          pageSize={7}
        />
      </div>
    </div>
  );
};
