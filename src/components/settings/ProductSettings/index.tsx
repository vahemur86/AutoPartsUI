import { useState } from "react";
import { Tab, TabGroup, Button } from "@/ui-kit";
import styles from "./ProductSettings.module.css";
import { ProductContent, type ExistingItem } from "./ProductContent";

const ProductSettings = () => {
  const [activeTab, setActiveTab] = useState("category-code");
  const [isExistingExpanded, setIsExistingExpanded] = useState(false);
  const [newFieldValue, setNewFieldValue] = useState("");
  const [existingItems, setExistingItems] = useState<ExistingItem[]>([
    { id: "1", name: "Name here", enabled: true },
    { id: "2", name: "Name here", enabled: true },
    { id: "3", name: "Name here", enabled: true },
  ]);

  const tabs = [
    { id: "category-code", label: "Category Code" },
    { id: "brand-code", label: "Brand Code" },
    { id: "unit-types-code", label: "Unit Types Code" },
    { id: "box-size-code", label: "Box Size Code" },
  ];

  const handleAddNew = () => {
    if (newFieldValue.trim()) {
      // Handle adding new item
      setNewFieldValue("");
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
            {tabs.map((tab) => (
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
          handleAddNew={handleAddNew}
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
        <Button variant="secondary" size="medium" onClick={() => {}}>
          Cancel
        </Button>
        <Button variant="primary" size="medium" onClick={() => {}}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default ProductSettings;
