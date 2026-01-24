import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  type FC,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import {
  DataTable,
  IconButton,
  TextField,
  Tab,
  TabGroup,
  Tooltip,
} from "@/ui-kit";

// icons
import { Plus, Search, X } from "lucide-react";

// components
import {
  CatalystBucketDropdown,
  type CatalystBucketForm,
} from "./catalystBucketActions/CatalystBucketDropdown";

// columns
import { getCatalystBucketColumns, getGroupCodeColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addCatalystBucket,
  fetchCatalystBuckets,
  editCatalystBucket,
  fetchCatalystBucketsByCode,
  fetchCatalystBucketsByGroup,
} from "@/store/slices/catalystBucketsSlice";

// types
import type { CatalystBucket } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

// styles
import styles from "./CatalystBuckets.module.css";

interface CatalystBucketsProps {
  withEdit?: boolean;
}

type TabType = "buckets" | "groups";

export const CatalystBuckets: FC<CatalystBucketsProps> = ({
  withEdit = true,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const {
    catalystBuckets,
    catalystBucketsByGroup,
    isLoading,
    error: apiError,
  } = useAppSelector((state) => state.catalystBuckets);

  // Check Role for Permission
  const isSuperAdmin = useMemo(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      return userData.role === "SuperAdmin";
    } catch {
      return false;
    }
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>("buckets");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeBucket, setActiveBucket] = useState<CatalystBucket | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasActiveSearch, setHasActiveSearch] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);

  // Initial load logic
  useEffect(() => {
    const loadData = async () => {
      if (activeTab === "buckets") {
        try {
          await dispatch(fetchCatalystBuckets()).unwrap();
        } catch (error) {
          toast.error(
            getApiErrorMessage(error, t("catalystBuckets.error.failedToFetch")),
          );
        }
      }
    };
    loadData();
  }, [dispatch, activeTab, t]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setHasActiveSearch(false);
    if (activeTab === "buckets") {
      dispatch(fetchCatalystBuckets());
    }
  }, [dispatch, activeTab]);

  const handleSearch = useCallback(async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      handleClearSearch();
      return;
    }

    try {
      if (activeTab === "buckets") {
        await dispatch(fetchCatalystBucketsByCode(trimmedQuery)).unwrap();
      } else if (activeTab === "groups" && isSuperAdmin) {
        await dispatch(fetchCatalystBucketsByGroup(trimmedQuery)).unwrap();
      }
      setHasActiveSearch(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("catalystBuckets.search.error")));
    }
  }, [searchQuery, dispatch, handleClearSearch, activeTab, t, isSuperAdmin]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery("");
    setHasActiveSearch(false);
  }, []);

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
          toast.success(t("catalystBuckets.success.bucketsUpdated"));
        } else {
          await dispatch(addCatalystBucket(data)).unwrap();
          toast.success(t("catalystBuckets.success.bucketCreated"));
        }
        handleClearSearch();
        handleCloseDropdown();
      } catch (error) {
        const fallback = activeBucket
          ? t("catalystBuckets.error.failedToUpdate")
          : t("catalystBuckets.error.failedToCreate");
        toast.error(getApiErrorMessage(error, fallback));
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, activeBucket, handleCloseDropdown, handleClearSearch, t],
  );

  const bucketColumns = useMemo(
    () => getCatalystBucketColumns({ withEdit, onEdit: handleOpenEdit }),
    [withEdit, handleOpenEdit],
  );

  const groupColumns = useMemo(() => getGroupCodeColumns(), []);

  return (
    <div className={styles.catalystBucketsWrapper}>
      {/* Tab Group visibility check */}
      <div className={styles.tabsContainer}>
        <TabGroup variant="segmented">
          <Tab
            variant="segmented"
            active={activeTab === "buckets"}
            text={t("catalystBuckets.tabs.catalystBuckets")}
            onClick={() => handleTabChange("buckets")}
          />
          {isSuperAdmin && (
            <Tab
              variant="segmented"
              active={activeTab === "groups"}
              text={t("catalystBuckets.tabs.groupCodes")}
              onClick={() => handleTabChange("groups")}
            />
          )}
        </TabGroup>
      </div>

      <div className={styles.catalystBucketsHeader}>
        <div className={styles.searchBucketWrapper}>
          <TextField
            placeholder={
              activeTab === "buckets"
                ? t("catalystBuckets.searchBucket")
                : t("catalystBuckets.searchGroup")
            }
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

        {activeTab === "buckets" && (
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
        )}
      </div>

      {activeTab === "buckets" && (
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
      )}

      <CatalystBucketDropdown
        open={isDropdownOpen}
        anchorRef={anchorRef}
        initialData={activeBucket}
        isLoading={isMutating}
        onOpenChange={(open) => !open && handleCloseDropdown()}
        onSave={handleSaveBucket}
      />

      <div className={styles.tableWrapper}>
        {activeTab === "buckets" ? (
          <DataTable
            data={catalystBuckets}
            columns={bucketColumns}
            pageSize={7}
          />
        ) : (
          // Nested check: even if activeTab is 'groups' (e.g. via URL or devtools), don't show for non-admins
          isSuperAdmin && (
            <div className={styles.groupTableContainer}>
              {hasActiveSearch && catalystBucketsByGroup ? (
                <DataTable
                  data={catalystBucketsByGroup.items}
                  columns={groupColumns}
                  pageSize={7}
                  renderBottomLeft={() => (
                    <div className={styles.totalPriceWrapper}>
                      <span className={styles.totalPriceLabel}>
                        {t("catalystBuckets.totalPrice")}:
                      </span>
                      <Tooltip
                        content={
                          <div className={styles.currencyList}>
                            {Object.entries(catalystBucketsByGroup.totals).map(
                              ([code, val]) => (
                                <div key={code} className={styles.currencyItem}>
                                  <span className={styles.currencyCode}>
                                    {code}:
                                  </span>
                                  <span className={styles.currencyValue}>
                                    {Number(val).toLocaleString()}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        }
                      >
                        <span className={styles.priceTrigger}>
                          {catalystBucketsByGroup.totals.USD?.toLocaleString()}{" "}
                          USD
                        </span>
                      </Tooltip>
                    </div>
                  )}
                />
              ) : (
                <div className={styles.emptySearchState}>
                  {t("catalystBuckets.messages.searchToSeeResults")}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};
