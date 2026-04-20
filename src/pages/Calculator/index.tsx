import { useState, type FC } from "react";
import styles from "./Calculator.module.css";
import { Button, Switch, TextField } from "@/ui-kit";
import { calculateSalesLot } from "@/services/warehouses/salesLots";
import { DollarSign, Scale, Calculator, Weight, CoinsIcon } from "lucide-react";
import type {
  SalesLotsCalculatorRequest,
  SalesLotsCalculatorResponse,
} from "@/types/warehouses/salesLots";
import { t } from "i18next";

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
  const [form, setForm] = useState<SalesLotsCalculatorRequest>(initialState);
  const [result, setResult] = useState<SalesLotsCalculatorResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const isManualMode = form.priceMode === 1;

  const displayValue = (v: number) => (v === 0 ? "" : String(v));

  const update = (key: keyof SalesLotsCalculatorRequest, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value === "" ? 0 : Number(value),
    }));
  };

  const onTogglePriceMode = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      priceMode: checked ? 1 : 0,
    }));
  };

  const onCalculate = async () => {
    setLoading(true);

    try {
      const res = await calculateSalesLot(form);
      setResult(res);
    } catch (e) {
      console.error("CALC ERROR:", e);
      alert("Failed to calculate sales lot");
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setForm(structuredClone(initialState));
    setResult(null);
    setLoading(false);
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>🧮 {t("calculator.title")}</h2>

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
            placeholder= {t("calculator.placeholder.pt_g")}
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
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            💰 {t("calculator.columns.price")}
          </h3>

          <div className={styles.switchRow}>
            <span>{t("calculator.form.priceMode")}</span>
            <Switch
              checked={isManualMode}
              onCheckedChange={onTogglePriceMode}
              label={
                isManualMode
                  ? t("calculator.form.priceMode.manual")
                  : t("calculator.form.priceMode.auto")
              }
            />
          </div>

          <label>
            <DollarSign size={14} />
            {t("calculator.form.ptPrice")}
          </label>
          <TextField
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
            placeholder= {t("calculator.placeholder.rhPrice")}
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
            placeholder= {t("calculator.placeholder.minProfit")}
            type="number"
            value={displayValue(form.minProfitMarginPercent)}
            onChange={(e: any) =>
              update("minProfitMarginPercent", e.target.value)
            }
          />

          <div className={styles.actions}>
            <Button onClick={onCalculate} disabled={loading}>
              <Calculator size={18} />
              {loading
                ? t("calculator.form.button.calculating")
                : t("calculator.form.button.calculate")}
            </Button>

            <Button variant="secondary" onClick={onCancel}>
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
