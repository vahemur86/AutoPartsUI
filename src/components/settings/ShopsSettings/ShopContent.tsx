import type { FC, Dispatch, SetStateAction } from "react";
import { IconButton, TextField } from "@/ui-kit";
import { Plus } from "lucide-react";
import styles from "./ShopsSettings.module.css";

export interface ExistingShop {
  id: string;
  name: string;
  enabled: boolean;
}

interface ShopContentProps {
  handleAddNew: () => void;
  handleAddNewClick: () => void;
  handleCancelAddNew: () => void;
  newFieldValue: string;
  setNewFieldValue: Dispatch<SetStateAction<string>>;
  showAddNewField: boolean;
  shopName: string;
  setShopName: Dispatch<SetStateAction<string>>;
  setIsExistingExpanded: Dispatch<SetStateAction<boolean>>;
  isExistingExpanded: boolean;
  handleToggleEnabled: (id: string) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  existingShops: ExistingShop[];
}

export const ShopContent: FC<ShopContentProps> = ({
  // handleAddNew,
  handleAddNewClick,
  // handleCancelAddNew,
  // newFieldValue,
  // setNewFieldValue,
  showAddNewField,
  shopName,
  setShopName,
  // setIsExistingExpanded,
  // isExistingExpanded,
  // handleToggleEnabled,
  // handleEdit,
  // handleDelete,
  // existingShops,
}) => {
  return (
    <>
      {/* Shop Name Section with Input and Add New Button */}
      <div className={styles.shopNameSection}>
        <div className={styles.shopNameHeader}>
          <div className={styles.addButtonWrapper}>
            <IconButton
              variant="primary"
              size="small"
              icon={<Plus size={12} color="#0e0f11" />}
              ariaLabel="Add New"
              onClick={handleAddNewClick}
            />
            <span className={styles.addButtonText}>Add new</span>
          </div>
        </div>
        <TextField
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="Type"
          label="Shop Key"
        />
        <div className={styles.addButtonMobile}>
          <div className={styles.addButtonWrapper}>
            <IconButton
              variant="primary"
              size="small"
              icon={<Plus size={12} color="#0e0f11" />}
              ariaLabel="Add New"
              onClick={handleAddNewClick}
            />
            <span className={styles.addButtonText}>Add new</span>
          </div>
        </div>
      </div>

      {/* Add New Field (shown when adding new shop) */}
      {showAddNewField && (
        <div className={styles.addNewFieldSection}>
          <div className={styles.shopNameSection}>
            <TextField
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Type"
              label="Shop Name"
            />
          </div>
        </div>
      )}
    </>
  );
};
