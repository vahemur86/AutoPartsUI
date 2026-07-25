import { useState, useEffect, useMemo, type FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { Select, TextField, Button, Checkbox } from "@/ui-kit";

// icons
import { Calculator } from "lucide-react";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCarModels,
  setLocalCalculation,
  clearCalculation,
} from "@/store/slices/ironCarShopSlice";

// types
import type { IronTypePrice } from "@/types/ironCarShop";

// services
import { getAvailableIronTypes } from "@/services/ironCarShop";

// styles
import styles from "./BuyIron.module.css";
import sharedStyles from "../../OperatorPage.module.css";

interface IronRowState {
  weight: string;
  isSelected: boolean;
  price: number;
}

interface BuyIronProps {
  cashRegisterId: number;
  onCalculateAttempt: () => void;
}

export const BuyIron: FC<BuyIronProps> = ({
  cashRegisterId,
  onCalculateAttempt,
}) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const { carModels, ironPrices } = useAppSelector(
    (state) => state.ironCarShop,
  );
  const { items: searchedCustomers } = useAppSelector(
    (state) => state.customers,
  );
  const { intake } = useAppSelector((state) => state.operator);

  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [availableIronTypes, setAvailableIronTypes] = useState<any[]>([]);
  const [isLoadingIronTypes, setIsLoadingIronTypes] = useState(false);
  const [ironRows, setIronRows] = useState<Record<number, IronRowState>>({});

  const isCustomerFound = useMemo(
    () => searchedCustomers.length > 0,
    [searchedCustomers],
  );

  const customerTypeId = useMemo(() => {
    if (intake?.customer?.customerTypeId) return intake.customer.customerTypeId;
    if (searchedCustomers.length > 0)
      return searchedCustomers[0].customerTypeId;
    return 0;
  }, [intake, searchedCustomers]);

  const isCalculateDisabled = useMemo(() => {
    const selectedEntries = Object.values(ironRows).filter(
      (row) => row.isSelected,
    );

    if (isLoadingIronTypes || !selectedBrandId || selectedEntries.length === 0) {
      return true;
    }

    return selectedEntries.some(
      (row) => !row.weight || row.weight === "." || parseFloat(row.weight) <= 0,
    );
  }, [ironRows, selectedBrandId, isLoadingIronTypes]);

  useEffect(() => {
    if (cashRegisterId) {
      dispatch(
        fetchCarModels({
          cashRegisterId,
          lang: i18n.language,
        }),
      );
    }
  }, [dispatch, cashRegisterId, i18n.language]);

  useEffect(() => {
    if (ironPrices.length === 0) {
      setSelectedBrandId("");
      setIronRows({});
    }
  }, [ironPrices.length]);

  // Load available iron types when brand and customer type are selected
  const handleBrandChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value;
    setSelectedBrandId(brandId);
    
    if (brandId && customerTypeId) {
      setIsLoadingIronTypes(true);
      try {
        const types = await getAvailableIronTypes(
          Number(brandId),
          customerTypeId,
          cashRegisterId,
          i18n.language,
        );
            setAvailableIronTypes(types);
        dispatch(clearCalculation());
        const initialRows: Record<number, IronRowState> = {};
        types.forEach((type) => {
          const price = type.prices?.[0]?.pricePerKg || 0;
          initialRows[type.ironTypeId] = {
            weight: "",
            isSelected: false,
            price,
          };
        });
      } catch (error) {
        toast.error(t("operatorPage.ironCarShop.failedToLoadIronTypes", "Failed to load iron types"));
        setAvailableIronTypes([]);
        setIronRows({});
      } finally {
        setIsLoadingIronTypes(false);
      }
    } else {
      setAvailableIronTypes([]);
      setIronRows({});
    }
  };

            

  useEffect(() => {
    const initialRows: Record<number, IronRowState> = {};
    availableIronTypes.forEach((type) => {
      const price = type.prices?.[0]?.pricePerKg || 0;
      initialRows[type.ironTypeId] = { weight: "", isSelected: false, price };
    });
    setIronRows(initialRows);
  }, [availableIronTypes]);

  const updateRow = (id: number, updates: Partial<IronRowState>) => {
    setIronRows((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  };

  const handleWeightChange = (id: number, val: string) => {
    if (val !== "" && !/^\d*\.?\d{0,4}$/.test(val)) return;
    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
      val = val.replace(/^0+/, "") || "0";
    }
    if (val === ".") val = "0.";

    updateRow(id, { weight: val });
  };

  const handleGlobalCalculate = () => {
    if (isCalculateDisabled) return;

    if (!isCustomerFound) {
      toast.error(t("operatorPage.ironCarShop.selectCustomerToCalculate"));
      return;
    }

    onCalculateAttempt();

    const selectedEntries = Object.entries(ironRows).filter(([, data]) =>
      data.isSelected,
    );

    const items: IronTypePrice[] = [];
    let weightKgTotal = 0;
    let totalAmountTotal = 0;

    selectedEntries.forEach(([idStr, data]) => {
      const id = Number(idStr);
      const weight = parseFloat(data.weight || "0");
      const pricePerKg = data.price || 0;
      const totalAmount = +(weight * pricePerKg).toFixed(2);
      const type = availableIronTypes.find((t) => t.ironTypeId === id);

      items.push({
        ironTypeId: id,
        name: type?.name || "",
        pricePerKg,
        weightKg: weight,
        totalAmount,
      });

      weightKgTotal += weight;
      totalAmountTotal += totalAmount;
    });

    dispatch(
      setLocalCalculation({
        selectedBrandId: Number(selectedBrandId),
        items,
        ironTotals: {
          weightKgTotal,
          totalAmountTotal,
        },
      }),
    );
  };

  return (
    <div className={styles.buyIronCard}>
      <div className={styles.headerSection}>
        <h2 className={sharedStyles.cardTitle}>{t("operatorPage.buyIron")}</h2>
        <div className={sharedStyles.divider} />

        <div className={styles.modelSelectWrapper}>
          <Select
            searchable
            label={t("operatorPage.ironCarShop.brand")}
            value={selectedBrandId}
            onChange={handleBrandChange}
            placeholder={t("common.select")}
            disabled={!isCustomerFound || isLoadingIronTypes}
            containerClassName={styles.wideSelect}
          >
            {carModels.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className={styles.ironList}>
        {selectedBrandId &&
          availableIronTypes.map((type) => {
            const row = ironRows[type.ironTypeId] || {
              weight: "",
              isSelected: false,
              price: type.prices?.[0]?.pricePerKg || 0,
            };
            return (
              <div
                key={type.ironTypeId}
                className={`${styles.ironRow} ${row.isSelected ? styles.activeRow : ""}`}
              >
                <div className={styles.checkGroup}>
                  <Checkbox
                    checked={row.isSelected}
                    onChange={(e) =>
                      updateRow(type.ironTypeId, {
                        isSelected: e.currentTarget.checked,
                      })
                    }
                  />
                  <span className={styles.typeName}>{type.name}</span>
                </div>

                <div className={styles.priceDisplay}>
                  <span className={styles.priceLabel}>
                    {t("operatorPage.ironCarShop.price")}
                  </span>
                  <span className={styles.priceValue}>
                    {row.price.toLocaleString()} AMD
                  </span>
                </div>

                <div className={styles.inputGroup}>
                  <TextField
                    placeholder="0.00"
                    value={row.weight}
                    onChange={(e) =>
                      handleWeightChange(type.ironTypeId, e.target.value)
                    }
                    disabled={!row.isSelected}
                    className={styles.weightInput}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {selectedBrandId && availableIronTypes.length > 0 && (
        <div className={styles.footerActions}>
          <Button
            fullWidth
            variant="primary"
            onClick={handleGlobalCalculate}
            disabled={isCalculateDisabled}
          >
            <Calculator size={18} style={{ marginRight: "8px" }} />
            {t("operatorPage.ironCarShop.calculate")}
          </Button>
        </div>
      )}
    </div>
  );
};
