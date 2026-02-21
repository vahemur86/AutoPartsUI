import { useState, useEffect, useMemo, type FC } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

// ui-kit
import { Select, TextField, Button, Checkbox } from "@/ui-kit";

// icons
import { Calculator } from "lucide-react";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCarModels,
  fetchIronTypes,
  calculateIronPrices,
} from "@/store/slices/ironCarShopSlice";

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
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { carModels, ironTypes, isLoading, ironPrices } = useAppSelector(
    (state) => state.ironCarShop,
  );
  const { items: searchedCustomers } = useAppSelector(
    (state) => state.customers,
  );
  const { intake } = useAppSelector((state) => state.operator);

  const [selectedModelId, setSelectedModelId] = useState<string>("");
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

  useEffect(() => {
    if (cashRegisterId) {
      dispatch(fetchCarModels({ cashRegisterId, lang: i18n.language }));
    }
  }, [dispatch, cashRegisterId]);

  // Handle Price Updates from Redux
  useEffect(() => {
    if (ironPrices && ironPrices.length > 0) {
      setIronRows((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          next[Number(id)].price = 0;
        });
        ironPrices.forEach((item) => {
          if (next[item.ironTypeId]) {
            next[item.ironTypeId].price = item.totalAmount;
          }
        });
        return next;
      });
    }
  }, [ironPrices]);

  useEffect(() => {
    if (ironPrices.length === 0) {
      setSelectedModelId("");
      setIronRows({});
    }
  }, [ironPrices.length]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedModelId(id);
    if (id) {
      dispatch(
        fetchIronTypes({
          carModelId: Number(id),
          cashRegisterId,
          lang: i18n.language,
        }),
      );
    }
  };

  useEffect(() => {
    const initialRows: Record<number, IronRowState> = {};
    ironTypes.forEach((type) => {
      initialRows[type.id] = { weight: "", isSelected: false, price: 0 };
    });
    setIronRows(initialRows);
  }, [ironTypes]);

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
    onCalculateAttempt();

    const selectedEntries = Object.entries(ironRows).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, data]) => data.isSelected && parseFloat(data.weight) > 0,
    );

    if (selectedEntries.length === 0 || !selectedModelId || !isCustomerFound)
      return;

    const weightsMap: Record<string, number> = {};
    selectedEntries.forEach(([id, data]) => {
      weightsMap[id] = parseFloat(data.weight);
    });

    dispatch(
      calculateIronPrices({
        params: {
          carModelId: Number(selectedModelId),
          customerTypeId,
          weightsJson: " " + JSON.stringify(weightsMap),
          lang: i18n.language,
        },
        cashRegisterId,
      }),
    );
  };

  return (
    <div className={styles.buyIronCard}>
      <h2 className={sharedStyles.cardTitle}>{t("operatorPage.buyIron")}</h2>
      <div className={sharedStyles.divider} />

      <div className={styles.modelSelectWrapper}>
        <Select
          searchable
          label={t("operatorPage.ironCarShop.carModel")}
          value={selectedModelId}
          onChange={handleModelChange}
          placeholder={t("common.select")}
          disabled={isLoading}
          containerClassName={styles.wideSelect}
        >
          {carModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </Select>
      </div>

      <div className={styles.ironList}>
        {selectedModelId &&
          ironTypes.map((type) => {
            const row = ironRows[type.id] || {
              weight: "",
              isSelected: false,
              price: 0,
            };
            return (
              <div
                key={type.id}
                className={`${styles.ironRow} ${row.isSelected ? styles.activeRow : ""}`}
              >
                <div className={styles.checkGroup}>
                  <Checkbox
                    checked={row.isSelected}
                    onChange={(e) =>
                      updateRow(type.id, {
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
                      handleWeightChange(type.id, e.target.value)
                    }
                    disabled={!row.isSelected}
                    className={styles.weightInput}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {selectedModelId && ironTypes.length > 0 && (
        <div className={styles.footerActions}>
          <Button
            fullWidth
            variant="primary"
            onClick={handleGlobalCalculate}
            disabled={isLoading}
          >
            <Calculator size={18} style={{ marginRight: "8px" }} />
            {t("operatorPage.ironCarShop.calculate")}
          </Button>
        </div>
      )}
    </div>
  );
};
