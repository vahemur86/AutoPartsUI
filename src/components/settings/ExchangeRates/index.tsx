import { useEffect, useState, type FC, useMemo } from "react";
import { useTranslation } from "react-i18next";

// icons
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  MoveRight,
  Check,
  X,
  Power,
  PowerOff,
} from "lucide-react";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchExchangeRates,
  addExchangeRate,
  editExchangeRate,
  editExchangeRateActivityStatus,
} from "@/store/slices/exchangeRatesSlice";

// components
import { TextField, Select, Button } from "@/ui-kit";

// types
import type { ExchangeRate } from "@/types/settings";

// styles
import styles from "./ExchangeRates.module.css";

export const ExchangeRates: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { exchangeRates = [], isLoading } = useAppSelector(
    (state) => state.exchangeRates,
  );

  // States for "Create New"
  const [newQuoteCurrency, setNewQuoteCurrency] = useState("EUR");
  const [newRateValue, setNewRateValue] = useState("");

  // UI States
  const [isExistingExpanded, setIsExistingExpanded] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Use useMemo to prevent unnecessary re-renders of translation strings
  const currencies = useMemo(
    () => [
      { code: "EUR", name: t("currencies.EUR") },
      { code: "RUB", name: t("currencies.RUB") },
      { code: "AMD", name: t("currencies.AMD") },
      { code: "USD", name: t("currencies.USD") },
    ],
    [t],
  );

  useEffect(() => {
    dispatch(fetchExchangeRates());
  }, [dispatch]);

  const handleAddRate = async () => {
    const rateNum = parseFloat(newRateValue);
    if (isNaN(rateNum) || rateNum <= 0) return;

    try {
      await dispatch(
        addExchangeRate({
          baseCurrencyCode: "USD",
          quoteCurrencyCode: newQuoteCurrency,
          rate: rateNum,
          effectiveFrom: new Date().toISOString(),
          isActive: true,
        }),
      ).unwrap();

      setNewRateValue("");
      dispatch(fetchExchangeRates());
    } catch (error) {
      console.error(t("exchangeRates.errors.addFailed"), error);
    }
  };

  const startEdit = (item: ExchangeRate) => {
    setEditingId(item.id);
    setEditValue((item.rate ?? 0).toString());
  };

  const saveEdit = async (item: ExchangeRate) => {
    const rateNum = parseFloat(editValue);
    if (isNaN(rateNum) || rateNum <= 0) return;

    try {
      await dispatch(
        editExchangeRate({
          id: item.id,
          payload: {
            ...item,
            rate: rateNum,
            effectiveFrom: new Date().toISOString(),
          },
        }),
      ).unwrap();

      setEditingId(null);
      dispatch(fetchExchangeRates());
    } catch (error) {
      console.error(t("exchangeRates.errors.saveFailed"), error);
    }
  };

  const handleToggleStatus = async (item: ExchangeRate) => {
    const action = item.isActive ? "deactivate" : "activate";
    try {
      await dispatch(
        editExchangeRateActivityStatus({ id: item.id, action }),
      ).unwrap();

      dispatch(fetchExchangeRates());
    } catch (error) {
      console.error(
        t("exchangeRates.errors.statusUpdateFailed", {
          action: t(`actions.${action}`),
        }),
        error,
      );
    }
  };

  return (
    <div className={styles.exchangeRatesWrapper}>
      <div className={styles.exchangeRates}>
        <div className={styles.scrollableContent}>
          <div className={styles.createNewSection}>
            <div className={styles.createNewHeader}>
              <h3 className={styles.createNewTitle}>
                {t("exchangeRates.createNew")}
              </h3>
            </div>

            <div className={styles.rateConverterRow}>
              <div className={styles.currencyGroup}>
                <TextField
                  value="1.00"
                  disabled
                  className={styles.staticInput}
                />
                <Select value="USD" disabled className={styles.currencySelect}>
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code}
                    </option>
                  ))}
                </Select>
              </div>

              <MoveRight size={20} className={styles.arrowIcon} />

              <div className={styles.currencyGroup}>
                <TextField
                  value={newRateValue}
                  onChange={(e) => setNewRateValue(e.target.value)}
                  placeholder={t("exchangeRates.placeholders.rate")}
                  className={styles.rateInput}
                />
                <Select
                  value={newQuoteCurrency}
                  onChange={(e) => setNewQuoteCurrency(e.target.value)}
                  className={styles.currencySelect}
                >
                  {currencies
                    .filter((c) => c.code !== "USD")
                    .map((curr) => (
                      <option
                        key={curr.code}
                        value={curr.code}
                        title={curr.name}
                      >
                        {curr.code}
                      </option>
                    ))}
                </Select>
              </div>
            </div>

            <div className={styles.actionButtonsRow}>
              <Button
                variant="secondary"
                onClick={handleAddRate}
                disabled={isLoading || !newRateValue}
              >
                {t("exchangeRates.addExchangeRate")}
              </Button>
              <Button
                variant="primary"
                onClick={() => dispatch(fetchExchangeRates())}
                disabled={isLoading}
              >
                {t("exchangeRates.updateRates")}
              </Button>
            </div>
          </div>

          <div className={styles.existingSection}>
            <button
              className={styles.existingHeader}
              onClick={() => setIsExistingExpanded(!isExistingExpanded)}
              aria-expanded={isExistingExpanded}
            >
              {isExistingExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              <span className={styles.existingTitle}>
                {t("productSettings.existing")}{" "}
                <span className={styles.existingCount}>
                  ({exchangeRates.length})
                </span>
              </span>
            </button>

            {isExistingExpanded && (
              <div className={styles.existingItems}>
                {exchangeRates.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.existingRateRow} ${!item.isActive ? styles.inactiveRow : ""}`}
                  >
                    <div className={styles.rateConverterRow}>
                      <div className={styles.currencyGroup}>
                        <TextField
                          value="1.00"
                          disabled
                          className={styles.staticInput}
                        />
                        <div className={styles.readOnlyCurrency}>
                          {item.baseCurrencyCode}
                        </div>
                      </div>

                      <MoveRight size={18} className={styles.arrowIcon} />

                      <div className={styles.currencyGroup}>
                        {editingId === item.id ? (
                          <TextField
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className={styles.rateInput}
                            autoFocus
                          />
                        ) : (
                          <div className={styles.displayRate}>
                            {Number(
                              (item.rate ?? 0).toFixed(4),
                            ).toLocaleString()}
                          </div>
                        )}
                        <div className={styles.readOnlyCurrency}>
                          {item.quoteCurrencyCode}
                        </div>
                      </div>
                    </div>

                    <div className={styles.rowActions}>
                      {editingId === item.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(item)}
                            className={styles.actionBtn}
                            title={t("actions.save")}
                            aria-label={t("actions.save")}
                          >
                            <Check size={16} color="#4ade80" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className={styles.actionBtn}
                            title={t("actions.cancel")}
                            aria-label={t("actions.cancel")}
                          >
                            <X size={16} color="#f87171" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(item)}
                            className={styles.actionBtn}
                            title={t("actions.edit")}
                            aria-label={t("actions.edit")}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={styles.actionBtn}
                            title={
                              item.isActive
                                ? t("actions.deactivate")
                                : t("actions.activate")
                            }
                            aria-label={
                              item.isActive
                                ? t("actions.deactivate")
                                : t("actions.activate")
                            }
                          >
                            {item.isActive ? (
                              <Power size={14} color="#f87171" />
                            ) : (
                              <PowerOff size={14} color="#4ade80" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
