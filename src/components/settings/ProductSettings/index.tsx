import { useState } from "react";
import { Tab, TabGroup, Button } from "@/ui-kit";
import styles from "./ProductSettings.module.css";
import { ProductContent, type ExistingItem } from "./ProductContent";
import { createCategory } from "@/services/settings/productSettings";
import { PRODUCT_SETTINGS_TABS } from "@/constants/settings";

const ProductSettings = () => {
  const [activeTab, setActiveTab] = useState("category-code");
  const [isExistingExpanded, setIsExistingExpanded] = useState(false);
  const [newFieldValue, setNewFieldValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [existingItems, setExistingItems] = useState<ExistingItem[]>([]);

  const handleSave = async () => {
    if (activeTab === "category-code" && newFieldValue.trim()) {
      setIsLoading(true);
      try {
        await createCategory(newFieldValue.trim());
        setExistingItems((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            name: newFieldValue.trim(),
            enabled: true,
          },
        ]);
        setNewFieldValue("");
        // alert("Category created successfully!");
      } catch (err: any) {
        console.error("Error creating category:", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log("Saving changes...");
    }
  };

  const handleToggleEnabled = (id: string) => {
    setExistingItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const handleEdit = (id: string) => {
    // Handle edit action
    console.log("Edit item:", id);
  };

  const handleDelete = (id: string) => {
    setExistingItems((items) => items.filter((item) => item.id !== id));
  };

  return (
    <div className={styles.productSettingsWrapper}>
      <div className={styles.productSettings}>
        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <TabGroup>
            {PRODUCT_SETTINGS_TABS.map((tab) => (
              <Tab
                key={tab.id}
                variant="segmented"
                active={activeTab === tab.id}
                text={tab.label}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </TabGroup>
        </div>

        <ProductContent
          newFieldValue={newFieldValue}
          setNewFieldValue={setNewFieldValue}
          setIsExistingExpanded={setIsExistingExpanded}
          isExistingExpanded={isExistingExpanded}
          handleToggleEnabled={handleToggleEnabled}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          existingItems={existingItems}
        />
      </div>
      {/* Action buttons */}
      <div className={styles.actionButtons}>
        <Button
          variant="secondary"
          size="medium"
          onClick={() => {
            setNewFieldValue("");
          }}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="medium"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default ProductSettings;
