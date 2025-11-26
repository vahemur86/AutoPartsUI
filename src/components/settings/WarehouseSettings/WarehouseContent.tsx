import type { FC } from "react";
import { IconButton, TextField } from "@/ui-kit";
import { Plus } from "lucide-react";
import styles from "./WarehouseSettings.module.css";

interface WarehouseContentProps {}

export const WarehouseContent: FC<WarehouseContentProps> = ({}) => {
  return (
    <>
      <div className={styles.warehouseNameSection}>
        <div className={styles.warehouseNameHeader}>
          <div className={styles.addButtonWrapper}>
            <IconButton
              variant="primary"
              size="small"
              icon={<Plus size={12} color="#0e0f11" />}
              ariaLabel="Add New"
            />
            <span className={styles.addButtonText}>Add new</span>
          </div>
        </div>
        <TextField
          value={""}
          onChange={() => {}}
          placeholder="Type"
          label="Warehouse key"
        />
        <div className={styles.addButtonMobile}>
          <div className={styles.addButtonWrapper}>
            <IconButton
              variant="primary"
              size="small"
              icon={<Plus size={12} color="#0e0f11" />}
              ariaLabel="Add New"
            />
            <span className={styles.addButtonText}>Add new</span>
          </div>
        </div>
      </div>

      {/* {showAddNewField && (
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
      )} */}
    </>
  );
};
