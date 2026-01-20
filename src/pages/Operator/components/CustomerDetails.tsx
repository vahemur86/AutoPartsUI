import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, User, Check } from "lucide-react";
import { TextField, Select, Button } from "@/ui-kit";
import { toast } from "react-toastify";
import { getOrCreateCustomer } from "@/services/operator";
import type { GetOrCreateCustomerResponse } from "@/services/operator";
import styles from "../OperatorPage.module.css";

export const CustomerDetails = () => {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [customerData, setCustomerData] =
    useState<GetOrCreateCustomerResponse | null>(null);

  const handleSearch = useCallback(async () => {
    if (!phoneNumber.trim()) {
      toast.error(t("customerDetails.validation.enterPhoneNumber"));
      return;
    }

    try {
      setIsSearching(true);
      const response = await getOrCreateCustomer(phoneNumber.trim());
      setCustomerData(response);

      // Log the response data as requested
      console.log("Customer search response:", response);

      toast.success(t("customerDetails.success.customerFound"));
    } catch (error: unknown) {
      console.error("Error searching for customer:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("customerDetails.error.failedToSearch");
      toast.error(errorMessage);
      setCustomerData(null);
    } finally {
      setIsSearching(false);
    }
  }, [phoneNumber, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
    <div className={styles.customerCard}>
      <div className={styles.customerHeader}>
        <div className={styles.clientType}>
          {t("customerDetails.client")}:{" "}
          <span className={styles.clientTypeValue}>
            {t("customerDetails.clientType.regular")}
          </span>{" "}
          | {t("customerDetails.discount")}:{" "}
          <span className={styles.discountValue}>12%</span>
        </div>
        <h2 className={styles.cardTitle}>{t("customerDetails.title")}</h2>
        <div className={styles.divider} />
      </div>

      <div className={styles.customerContent}>
        <TextField
          placeholder={t("customerDetails.phonePlaceholder")}
          icon={
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: isSearching ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label={t("customerDetails.search")}
            >
              <Search size={16} />
            </button>
          }
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSearching}
        />

        {customerData && (
          <div className={styles.customerProfile}>
            <div className={styles.profileAvatar}>
              <User size={32} />
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>Ashot S.</div>
              <div className={styles.profileType}>
                {t("customerDetails.clientType.regular")}
              </div>
              <div className={styles.profileDiscount}>
                {t("customerDetails.discount")}: 12%
              </div>
            </div>
          </div>
        )}

        {customerData && (
          <div className={styles.customerFields}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                {t("customerDetails.phone")}:
              </label>
              <TextField value={phoneNumber} disabled />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                {t("customerDetails.autoModel")}:
              </label>
              <Select defaultValue="toyota-camry">
                <option value="toyota-camry">Toyota Camry</option>
              </Select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.customerActions}>
          <Button
            variant="primary"
            size="small"
            fullWidth
            className={styles.acceptButton}
          >
            <Check size={20} />
            {t("customerDetails.acceptAndPurchase")}
          </Button>
        </div>
      </div>
    </div>
  );
};
