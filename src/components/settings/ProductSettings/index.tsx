import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "react-toastify";

import { ProductContent } from "./ProductContent";
import { PRODUCT_SETTINGS_TABS, TAB_CONFIG } from "@/constants/settings";
import type {
  ExistingItem,
  TabId,
  ProductSettingItem,
} from "@/types/settings";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { Tab, TabGroup, Button } from "@/ui-kit";
import styles from "./ProductSettings.module.css";

export const ProductSettings = () => {
  const dispatch = useAppDispatch();
  const { brands, categories, unitTypes, boxSizes, isLoading, fetchedData } =
    useAppSelector((state) => state.productSettings);

  const [activeTabId, setActiveTabId] = useState<TabId>(
    PRODUCT_SETTINGS_TABS[0].id as TabId
  );
  const [isExistingExpanded, setIsExistingExpanded] = useState(false);
  const [newFieldValue, setNewFieldValue] = useState("");
  const fetchingRef = useRef<Set<string>>(new Set());

  const activeTab = useMemo(
    () => PRODUCT_SETTINGS_TABS.find((tab) => tab.id === activeTabId),
    [activeTabId]
  );

  const currentData = useMemo((): ProductSettingItem[] => {
    const config = TAB_CONFIG[activeTabId];
    if (!config) return [];

    const dataMap: Record<string, ProductSettingItem[]> = {
      brands,
      categories,
      unitTypes,
      boxSizes,
    };
    return dataMap[config.dataKey] || [];
  }, [activeTabId, brands, categories, unitTypes, boxSizes]);

  const existingItems: ExistingItem[] = useMemo(
    () =>
      currentData.map((item) => ({
        id: item.id.toString(),
        name: item.code,
        enabled: item.enabled ?? true,
      })),
    [currentData]
  );

  // Optimized fetch logic - only fetch if not already fetched
  useEffect(() => {
    const config = TAB_CONFIG[activeTabId];
    if (!config) return;

    const dataKey = config.dataKey as keyof typeof fetchedData;
    const alreadyFetched = fetchedData[dataKey];
    const isCurrentlyFetching = fetchingRef.current.has(dataKey);

    // Only fetch if we haven't fetched this data yet, we're not currently loading,
    // and we haven't already initiated a fetch for this dataKey
    if (!alreadyFetched && !isLoading && !isCurrentlyFetching) {
      fetchingRef.current.add(dataKey);
      dispatch(config.actions.fetch()).finally(() => {
        // Remove from fetching set after fetch completes (success or failure)
        fetchingRef.current.delete(dataKey);
      });
    }
    // Only depend on activeTabId - fetchedData is accessed from selector, not as dependency
    // This prevents duplicate requests when other fetchedData properties change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId]);

  const executeAction = useCallback(
    async (
      actionType: "add" | "update" | "remove",
      payload: string | { id: number; code: string } | number
    ) => {
      if (!activeTab) return;

      const config = TAB_CONFIG[activeTabId];
      if (!config) return;

      try {
        if (actionType === "add") {
          await dispatch(config.actions.add(payload as string)).unwrap();
        } else if (actionType === "update") {
          const updatePayload = payload as { id: number; code: string };
          await dispatch(config.actions.update(updatePayload)).unwrap();
          // After update, refetch to ensure we're in sync with backend
          // This handles cases where backend might create a new item instead of updating
          await dispatch(config.actions.fetch()).unwrap();
        } else {
          await dispatch(config.actions.remove(payload as number)).unwrap();
        }

        const actionPastTense =
          actionType === "add"
            ? "created"
            : actionType === "remove"
            ? "deleted"
            : "updated";

        toast.success(`${activeTab.type} ${actionPastTense} successfully`);

        if (actionType === "add") {
          setNewFieldValue("");
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to ${actionType} ${activeTab.type}`;
        console.error(`Error ${actionType}ing ${activeTab.type}:`, err);
        toast.error(errorMessage);
      }
    },
    [activeTab, activeTabId, dispatch]
  );

  const handleSave = useCallback(async () => {
    const trimmedValue = newFieldValue.trim();
    if (!trimmedValue) return;

    await executeAction("add", trimmedValue);
  }, [newFieldValue, executeAction]);

  const handleEdit = useCallback(
    async (id: string, newName: string) => {
      await executeAction("update", { id: Number(id), code: newName });
    },
    [executeAction]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await executeAction("remove", Number(id));
    },
    [executeAction]
  );

  const handleCancel = useCallback(() => {
    setNewFieldValue("");
  }, []);

  return (
    <div className={styles.productSettingsWrapper}>
      <div className={styles.productSettings}>
        <div className={styles.tabsContainer}>
          <TabGroup>
            {PRODUCT_SETTINGS_TABS.map((tab) => (
              <Tab
                key={tab.id}
                variant="segmented"
                active={activeTabId === tab.id}
                text={tab.label}
                onClick={() => setActiveTabId(tab.id)}
              />
            ))}
          </TabGroup>
        </div>

        <ProductContent
          newFieldValue={newFieldValue}
          setNewFieldValue={setNewFieldValue}
          setIsExistingExpanded={setIsExistingExpanded}
          isExistingExpanded={isExistingExpanded}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          existingItems={existingItems}
          isLoading={isLoading}
        />
      </div>

      <div className={styles.actionButtons}>
        <Button
          variant="secondary"
          size="medium"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="medium"
          onClick={handleSave}
          disabled={isLoading || !newFieldValue.trim()}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
