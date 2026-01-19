import { Search, User, Check } from "lucide-react";
import { TextField, Select, Button } from "@/ui-kit";
import styles from "../OperatorPage.module.css";

export const CustomerDetails = () => {
  return (
    <div className={styles.customerCard}>
      <div className={styles.customerHeader}>
        <div className={styles.clientType}>
          Client: <span className={styles.clientTypeValue}>Regular</span> |
          Discount: <span className={styles.discountValue}>12%</span>
        </div>
        <h2 className={styles.cardTitle}>Customer Details</h2>
        <div className={styles.divider} />
      </div>

      <div className={styles.customerContent}>
        <TextField placeholder="+374 93 124567" icon={<Search size={16} />} />

        <div className={styles.customerProfile}>
          <div className={styles.profileAvatar}>
            <User size={32} />
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>Ashot S.</div>
            <div className={styles.profileType}>Regular</div>
            <div className={styles.profileDiscount}>Discount: 12%</div>
          </div>
        </div>

        <div className={styles.customerFields}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Phone:</label>
            <TextField value="+374 93 124567" disabled />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Auto Model:</label>
            <Select defaultValue="toyota-camry">
              <option value="toyota-camry">Toyota Camry</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.customerActions}>
        <Button
          variant="primary"
          size="small"
          fullWidth
          className={styles.acceptButton}
        >
          <Check size={20} />
          Accept and Purchase
        </Button>
      </div>
    </div>
  );
};
