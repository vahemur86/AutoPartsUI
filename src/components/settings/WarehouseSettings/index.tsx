import { Button } from "@/ui-kit";
import { WarehouseContent } from "./WarehouseContent";
import styles from "./WarehouseSettings.module.css";

const WarehouseSettings = () => {
  return (
    <div className={styles.warehouseSettingsWrapper}>
      <div className={styles.warehouseSettings}>
        <WarehouseContent />
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

export default WarehouseSettings;
