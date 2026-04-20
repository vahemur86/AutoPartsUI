import { useEffect, useState, type FC } from "react";
import styles from "./Calculator.module.css";
import { Button, Switch, TextField } from "@/ui-kit";
import { calculateSalesLot } from "@/services/warehouses/salesLots";
import { DollarSign, Scale, Calculator, Weight, CoinsIcon } from "lucide-react";
import type {
  SalesLotsCalculatorRequest,
  SalesLotsCalculatorResponse,
} from "@/types/warehouses/salesLots";
import { t } from "i18next";
import { fetchMetalRates } from "@/store/slices/metalRatesSlice";
import { fetchExchangeRates } from "@/store/slices/exchangeRatesSlice";
import { useAppDispatch } from "@/store/hooks";
import { toast } from "react-toastify";

const initialState: SalesLotsCalculatorRequest = {
  cashRegisterId: 0,
  powderKg: 0,
  pt_g: 0,
  pd_g: 0,
  rh_g: 0,
  customerBonusPercent: 0,
  minProfitMarginPercent: 0,
  priceMode: 0,
  ptPrice: 0,
  pdPrice: 0,
  rhPrice: 0,
  usdRate: 0,
};

export const NewCalculator: FC = () => {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<SalesLotsCalculatorRequest>(initialState);
  const [result, setResult] = useState<SalesLotsCalculatorResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const isManualMode = form.priceMode === 1;

  const displayValue = (v: number) => (v === 0 && !result ? "" : String(v));

  const update = (key: keyof SalesLotsCalculatorRequest, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value === "" ? 0 : Number(value),
    }));
  };

  const loadDefaults = async () => {
    try {
      const metalRes = await dispatch(
        fetchMetalRates(form.cashRegisterId),
      ).unwrap();

      const exchangeRes = await dispatch(
        fetchExchangeRates({ cashRegisterId: form.cashRegisterId }),
      ).unwrap();

      const metal = metalRes.find((m) => m.isActive) ?? metalRes[0];

      const usd = exchangeRes.find(
        (e) =>
          e.baseCurrencyCode === "USD" &&
          e.quoteCurrencyCode === "AMD" &&
          e.isActive,
      );

      setForm((prev) => ({
        ...prev,
        ptPrice:
          prev.priceMode === 1 ? prev.ptPrice : (metal?.ptPricePerGram ?? 0),
        pdPrice:
          prev.priceMode === 1 ? prev.pdPrice : (metal?.pdPricePerGram ?? 0),
        rhPrice:
          prev.priceMode === 1 ? prev.rhPrice : (metal?.rhPricePerGram ?? 0),
        usdRate: prev.priceMode === 1 ? prev.usdRate : (usd?.rate ?? 0),
      }));
    } catch (e) {
      console.error("Failed to load defaults", e);
    }
  };

  const onTogglePriceMode = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      priceMode: checked ? 1 : 0,
    }));
  };

  const onCalculate = async () => {
    console.log("FORM SENT:", form);
    setLoading(true);
    try {
      const res = await calculateSalesLot(form);
      console.log("RESULT:", res);
      setResult(res);
    } catch (e) {
      toast.error("Failed to calculate sales lot");
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setForm(structuredClone(initialState));
    setResult(null);
    setLoading(false);
  };

  useEffect(() => {
    loadDefaults();
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>🧮 {t("calculator.title")}</h2>

        <div className={styles.modeInline}>
          <span className={!isManualMode ? styles.active : ""}>
            {t("calculator.form.priceMode.auto")}
          </span>

          <Switch checked={isManualMode} onCheckedChange={onTogglePriceMode} />

          <span className={isManualMode ? styles.active : ""}>
            {t("calculator.form.priceMode.manual")}
          </span>
        </div>
      </div>

      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            ⚖️ {t("calculator.columns.weight")}
          </h3>

          <label>
            <Weight size={14} /> {t("calculator.form.powderKg")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.powderKg")}
            type="number"
            value={displayValue(form.powderKg)}
            onChange={(e: any) => update("powderKg", e.target.value)}
          />

          <label>
            <Scale size={14} /> {t("calculator.form.pt_g")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.pt_g")}
            type="number"
            value={displayValue(form.pt_g)}
            onChange={(e: any) => update("pt_g", e.target.value)}
          />

          <label>
            <Scale size={14} /> {t("calculator.form.pd_g")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.pd_g")}
            type="number"
            value={displayValue(form.pd_g)}
            onChange={(e: any) => update("pd_g", e.target.value)}
          />

          <label>
            <Scale size={14} /> {t("calculator.form.rh_g")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.rh_g")}
            type="number"
            value={displayValue(form.rh_g)}
            onChange={(e: any) => update("rh_g", e.target.value)}
          />
          {result && (
            <div className={styles.totalsWrapper}>
              <div className={styles.totalsSection}>
                <div className={styles.totalsHeader}>
                  {t("calculator.columns.totals")}
                </div>

                <div className={styles.totalsGrid}>
                  <div className={styles.totalCard}>
                    <span>Pt</span>
                    <b>{result.totalpt_g.toFixed(2)}</b>
                    <small>g</small>
                  </div>

                  <div className={styles.totalCard}>
                    <span>Pd</span>
                    <b>{result.totalpd_g.toFixed(2)}</b>
                    <small>g</small>
                  </div>

                  <div className={styles.totalCard}>
                    <span>Rh</span>
                    <b>{result.totalrh_g.toFixed(2)}</b>
                    <small>g</small>
                  </div>
                </div>
              </div>

              <div className={styles.totalsSection}>
                <div className={styles.totalsHeader}>
                  {t("calculator.columns.details")}
                </div>

                <div className={styles.totalsGrid}>
                  <div className={styles.totalCard}>
                    <span>{t("calculator.form.pt_g")}</span>
                    <b>{result.pt_g.toFixed(2)}</b>
                  </div>

                  <div className={styles.totalCard}>
                    <span>{t("calculator.form.pd_g")}</span>
                    <b>{result.pd_g.toFixed(2)}</b>
                  </div>

                  <div className={styles.totalCard}>
                    <span>{t("calculator.form.rh_g")}</span>
                    <b>{result.rh_g.toFixed(2)}</b>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`${styles.card} ${
            !isManualMode ? styles.autoPriceCard : ""
          }`}
        >
          <h3 className={styles.cardTitle}>
            💰 {t("calculator.columns.price")}
            {!isManualMode && <span className={styles.autoBadge}>LIVE</span>}
          </h3>
          <label>
            <DollarSign size={14} />
            {t("calculator.form.ptPrice")}
          </label>
          <TextField
            className={isManualMode ? styles.autoField : ""}
            placeholder={t("calculator.placeholder.ptPrice")}
            type="number"
            disabled={!isManualMode}
            value={displayValue(form.ptPrice)}
            onChange={(e: any) => update("ptPrice", e.target.value)}
          />

          <label>
            <DollarSign size={14} /> {t("calculator.form.pdPrice")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.pdPrice")}
            type="number"
            disabled={!isManualMode}
            value={displayValue(form.pdPrice)}
            onChange={(e: any) => update("pdPrice", e.target.value)}
          />

          <label>
            <DollarSign size={14} /> {t("calculator.form.rhPrice")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.rhPrice")}
            type="number"
            disabled={!isManualMode}
            value={displayValue(form.rhPrice)}
            onChange={(e: any) => update("rhPrice", e.target.value)}
          />

          <label>
            <DollarSign size={14} /> {t("calculator.form.exchange")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.exchange")}
            type="number"
            disabled={!isManualMode}
            value={displayValue(form.usdRate)}
            onChange={(e: any) => update("usdRate", e.target.value)}
          />

          <label>
            <CoinsIcon size={14} /> {t("calculator.form.customerBonus")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.customerBonus")}
            type="number"
            value={displayValue(form.customerBonusPercent)}
            onChange={(e: any) =>
              update("customerBonusPercent", e.target.value)
            }
          />

          <label>
            <CoinsIcon size={14} /> {t("calculator.form.minProfit")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.minProfit")}
            type="number"
            value={displayValue(form.minProfitMarginPercent)}
            onChange={(e: any) =>
              update("minProfitMarginPercent", e.target.value)
            }
          />
          <div className={styles.actions}>
            <Button onClick={onCalculate} disabled={loading} fullWidth>
              <Calculator size={18} />
              {loading
                ? t("calculator.form.button.calculating")
                : t("calculator.form.button.calculate")}
            </Button>

            <Button variant="secondary" onClick={onCancel} fullWidth>
              {t("calculator.form.button.cancel")}
            </Button>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            📊 {t("calculator.columns.result")}
          </h3>

          {!result ? (
            <span>{t("calculator.columns.noResult")}</span>
          ) : (
            <div className={styles.resultGrid}>
              <div>
                <span> {t("calculator.form.kitko")}</span>
                <b>{result.kitcoAmd.toFixed(2)}</b>
              </div>

              <div>
                <span>{t("calculator.form.finalBase")}</span>
                <b>{result.finalBaseAmd.toFixed(2)}</b>
              </div>

              <div>
                <span>{t("calculator.form.offer")}</span>
                <b>{result.customerOfferAmd.toFixed(2)}</b>
              </div>
              <div>
                <span>{t("calculator.form.maxCustomerPercent")}</span>
                <b>{result.maxCustomerPercent.toFixed(2)}%</b>
              </div>
              <div>
                <span>{t("calculator.form.profit")}</span>
                <b className={styles.profit}>{result.profitAmd.toFixed(2)}</b>
              </div>

              <div>
                <span>{t("calculator.form.profitPercent")}</span>
                <b className={styles.profit}>
                  {result.profitPercent.toFixed(2)}%
                </b>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
