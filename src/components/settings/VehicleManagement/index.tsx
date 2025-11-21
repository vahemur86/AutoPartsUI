import { useState } from "react";
import { Tab, TabGroup, Button } from "@/ui-kit";
import styles from "./VehicleManagement.module.css";
import { VehicleContent, type ExistingVehicleItem } from "./VehicleContent";

const VehicleManagement = () => {
  const [activeTab, setActiveTab] = useState("new-brand");
  const [isExistingExpanded, setIsExistingExpanded] = useState(false);
  const [newFieldValue, setNewFieldValue] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);
  const [existingItems, setExistingItems] = useState<ExistingVehicleItem[]>([
    { id: "1", name: "BMW", enabled: true },
    { id: "2", name: "BMW", enabled: true },
    { id: "3", name: "BMW", enabled: true },
  ]);

  const tabs = [
    { id: "new-brand", label: "New Brand" },
    { id: "brands", label: "Brands" },
  ];

  const handlePhotoUpload = (file: File) => {
    // Handle photo upload logic here
    console.log("Photo uploaded:", file.name);
  };

  const handleAddNew = () => {
    if (newFieldValue.trim()) {
      // Handle adding new item
      const newItem: ExistingVehicleItem = {
        id: Date.now().toString(),
        name: newFieldValue,
        enabled: true,
        photoUrl: newPhotoUrl || undefined,
      };
      setExistingItems((items) => [...items, newItem]);
      setNewFieldValue("");
      setNewPhotoUrl(null);
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
    const item = existingItems.find((item) => item.id === id);
    if (item) {
      setNewFieldValue(item.name);
      setNewPhotoUrl(item.photoUrl || null);
      handleDelete(id);
    }
  };

  const handleDelete = (id: string) => {
    setExistingItems((items) => items.filter((item) => item.id !== id));
  };

  return (
    <div className={styles.vehicleManagementWrapper}>
      <div className={styles.vehicleManagement}>
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

        <VehicleContent
          handleAddNew={handleAddNew}
          newFieldValue={newFieldValue}
          setNewFieldValue={setNewFieldValue}
          newPhotoUrl={newPhotoUrl}
          setNewPhotoUrl={setNewPhotoUrl}
          handlePhotoUpload={handlePhotoUpload}
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

export default VehicleManagement;
