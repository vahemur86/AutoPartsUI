import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

import { ProductContent } from "./ProductContent";
import { PRODUCT_SETTINGS_TABS } from "@/constants/settings";
import type { ExistingItem } from "@/types.ts/settings";

import { Tab, TabGroup, Button } from "@/ui-kit";
import styles from "./ProductSettings.module.css";

const ProductSettings = () => {
  const [activeTabId, setActiveTabId] = useState(PRODUCT_SETTINGS_TABS[0].id);
  const [isExistingExpanded, setIsExistingExpanded] = useState(false);
  const [newFieldValue, setNewFieldValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [existingItems, setExistingItems] = useState<ExistingItem[]>([]);
  const loadingRef = useRef(false);
  const lastLoadedTabRef = useRef<string | null>(null);

  const activeTab = PRODUCT_SETTINGS_TABS.find((tab) => tab.id === activeTabId);

  const loadExistingItems = async () => {
    if (!activeTab || loadingRef.current) return;

    if (lastLoadedTabRef.current === activeTabId) {
      return;
    }

    loadingRef.current = true;
    lastLoadedTabRef.current = activeTabId;
    setIsLoading(true);
    try {
      const data = await activeTab.service.getAll();
      setExistingItems(
        data.map((item: any) => ({
          id: item.id.toString(),
          name: item.code,
          enabled: item.enabled ?? true,
        }))
      );
    } catch (err: any) {
      console.error(`Error loading ${activeTab.type}:`, err);
      toast.error(err.message || `Failed to load ${activeTab.type}`);
      lastLoadedTabRef.current = null;
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    if (activeTab) {
      loadExistingItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId]);

  const handleSave = async () => {
    if (!activeTab || !newFieldValue.trim()) return;

    setIsLoading(true);
    try {
      await activeTab.service.create(newFieldValue.trim());
      lastLoadedTabRef.current = null;
      await loadExistingItems();
      setNewFieldValue("");
      toast.success(`${activeTab.type} created successfully`);
    } catch (err: any) {
      console.error(`Error creating ${activeTab.type}:`, err);
      toast.error(err.message || `Failed to create ${activeTab.type}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (id: string, newName: string) => {
    if (!activeTab) return;

    try {
      await activeTab.service.update(Number(id), newName);
      lastLoadedTabRef.current = null;
      await loadExistingItems();
      toast.success(`${activeTab.type} updated successfully`);
    } catch (err: any) {
      console.error(`Error updating ${activeTab.type}:`, err);
      toast.error(err.message || `Failed to update ${activeTab.type}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeTab) return;

    try {
      await activeTab.service.delete(Number(id));
      setExistingItems((items) => items.filter((item) => item.id !== id));
      toast.success(`${activeTab.type} deleted successfully`);
    } catch (err: any) {
      console.error(`Error deleting ${activeTab.type}:`, err);
      toast.error(err.message || `Failed to delete ${activeTab.type}`);
    }
  };

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
          onClick={() => setNewFieldValue("")}
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

export default ProductSettings;
