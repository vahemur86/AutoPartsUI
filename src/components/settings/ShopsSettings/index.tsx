import { useState } from "react";
import { Button } from "@/ui-kit";
import styles from "./ShopsSettings.module.css";
import { ShopContent, type ExistingShop } from "./ShopContent";

const ShopsSettings = () => {
  const [isExistingExpanded, setIsExistingExpanded] = useState(false);
  const [showAddNewField, setShowAddNewField] = useState(false);
  const [newFieldValue, setNewFieldValue] = useState("");
  const [shopName, setShopName] = useState("");
  const [existingShops, setExistingShops] = useState<ExistingShop[]>([
    { id: "1", name: "Name here", enabled: true },
    { id: "2", name: "Name here", enabled: true },
    { id: "3", name: "Name here", enabled: true },
  ]);

  const handleAddNewClick = () => {
    setShowAddNewField(true);
  };

  const handleCancelAddNew = () => {
    setNewFieldValue("");
    setShowAddNewField(false);
  };

  const handleAddNew = () => {
    if (newFieldValue.trim()) {
      // Handle adding new shop
      const newShop: ExistingShop = {
        id: Date.now().toString(),
        name: newFieldValue,
        enabled: true,
      };
      setExistingShops((shops) => [...shops, newShop]);
      setNewFieldValue("");
      setShowAddNewField(false);
    }
  };

  const handleToggleEnabled = (id: string) => {
    setExistingShops((shops) =>
      shops.map((shop) =>
        shop.id === id ? { ...shop, enabled: !shop.enabled } : shop
      )
    );
  };

  const handleEdit = (id: string) => {
    // Handle edit action
    console.log("Edit shop:", id);
  };

  const handleDelete = (id: string) => {
    setExistingShops((shops) => shops.filter((shop) => shop.id !== id));
  };

  return (
    <div className={styles.shopsSettingsWrapper}>
      <div className={styles.shopsSettings}>
        <ShopContent
          handleAddNew={handleAddNew}
          handleAddNewClick={handleAddNewClick}
          handleCancelAddNew={handleCancelAddNew}
          newFieldValue={newFieldValue}
          setNewFieldValue={setNewFieldValue}
          showAddNewField={showAddNewField}
          shopName={shopName}
          setShopName={setShopName}
          setIsExistingExpanded={setIsExistingExpanded}
          isExistingExpanded={isExistingExpanded}
          handleToggleEnabled={handleToggleEnabled}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          existingShops={existingShops}
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

export default ShopsSettings;
