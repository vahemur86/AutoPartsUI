import { useEffect, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Calculator.module.css";
import { Button, Switch, TextField } from "@/ui-kit";
import { calculateSalesLot, calculateDollarSalesLot } from "@/services/warehouses/salesLots";
import { DollarSign, Scale, Calculator, Weight, CoinsIcon, ChevronDown, BarChart3 } from "lucide-react";
import type {
  DollarCalculatorRequest,
  DollarCalculatorResponse,
  SalesLotsCalculatorRequest,
  SalesLotsCalculatorResponse,
} from "@/types/warehouses/salesLots";
import { getCurrentUsdAmdExchangeRate } from "@/services/settings/exchangeRates";
import { useAppDispatch } from "@/store/hooks";
import { toast } from "react-toastify";
import { fetchMetalPrices } from "@/store/slices/metalPricesSlice";

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

const dollarInitialState: DollarCalculatorRequest = {
  powderKg: 0,
  pt_g: 0,
  pd_g: 0,
  rh_g: 0,
  ptPrice: 0,
  pdPrice: 0,
  rhPrice: 0,
  ptReducePercent: 0,
  pdReducePercent: 0,
  rhReducePercent: 0,
  salePercent: 0,
  moisturePercent: null,
  dollarCostPerKg: null,
};

export const NewCalculator: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<"catalyst" | "dollar">("catalyst");
  const [form, setForm] = useState<SalesLotsCalculatorRequest>(initialState);
  const [result, setResult] = useState<SalesLotsCalculatorResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [showHiddenItems, setShowHiddenItems] = useState(false);
  const [inputValues, setInputValues] = useState<
    Record<keyof SalesLotsCalculatorRequest, string>
  >({} as Record<keyof SalesLotsCalculatorRequest, string>);

  // Dollar calculator state
  const [dollarForm, setDollarForm] = useState<DollarCalculatorRequest>(dollarInitialState);
  const [dollarResult, setDollarResult] = useState<DollarCalculatorResponse | null>(null);
  const [dollarLoading, setDollarLoading] = useState(false);
  const [dollarInputValues, setDollarInputValues] = useState<
    Record<keyof DollarCalculatorRequest, string>
  >({} as Record<keyof DollarCalculatorRequest, string>);

  const isManualMode = form.priceMode === 1;

  const displayValue = (key: keyof SalesLotsCalculatorRequest) => {
    const rawValue = inputValues[key];

    if (rawValue !== undefined) {
      return rawValue;
    }

    const value = form[key];
    return value === 0 && !result ? "" : String(value);
  };

  const update = (key: keyof SalesLotsCalculatorRequest, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [key]: value,
    }));

    setForm((prev) => ({
      ...prev,
      [key]: value === "" ? 0 : Number(value),
    }));
  };

  const loadDefaults = async () => {
    try {
      const metalRes = await dispatch(
        fetchMetalPrices(form.cashRegisterId),
      ).unwrap();

      const exchangeRes = await getCurrentUsdAmdExchangeRate(form.cashRegisterId);

      const pt = metalRes.find((m) => m.metalName === "Platinum");
      const pd = metalRes.find((m) => m.metalName === "Palladium");
      const rh = metalRes.find((m) => m.metalName === "Rhodium");

      setForm((prev) => ({
        ...prev,
        ptPrice: prev.priceMode === 1 ? prev.ptPrice : (pt?.price ?? 0),
        pdPrice: prev.priceMode === 1 ? prev.pdPrice : (pd?.price ?? 0),
        rhPrice: prev.priceMode === 1 ? prev.rhPrice : (rh?.price ?? 0),
        usdRate: prev.priceMode === 1 ? prev.usdRate : (exchangeRes?.rate ?? 0),
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
    } catch {
      toast.error(t("calculator.error.failedToCalculate"));
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    setForm(structuredClone(initialState));
    setInputValues({} as Record<keyof SalesLotsCalculatorRequest, string>);
    setResult(null);
    setLoading(false);
  };

  // Dollar calculator functions
  const dollarDisplayValue = (key: keyof DollarCalculatorRequest) => {
    const rawValue = dollarInputValues[key];
    if (rawValue !== undefined) {
      return rawValue;
    }
    const value = dollarForm[key];
    return value === 0 || value === null ? "" : String(value);
  };

  const dollarUpdate = (key: keyof DollarCalculatorRequest, value: string) => {
    setDollarInputValues((prev) => ({
      ...prev,
      [key]: value,
    }));

    const numValue = value === "" ? 0 : Number(value);
    setDollarForm((prev) => ({
      ...prev,
      [key]: key === "moisturePercent" || key === "dollarCostPerKg" 
        ? (value === "" ? null : numValue)
        : numValue,
    }));
  };

  const onDollarCalculate = async () => {
    setDollarLoading(true);
    try {
      const res = await calculateDollarSalesLot(dollarForm);
      setDollarResult(res.data);
    } catch {
      toast.error(t("calculator.error.failedToCalculate"));
    } finally {
      setDollarLoading(false);
    }
  };

  const onDollarCancel = () => {
    setDollarForm(structuredClone(dollarInitialState));
    setDollarInputValues({} as Record<keyof DollarCalculatorRequest, string>);
    setDollarResult(null);
    setDollarLoading(false);
  };

  useEffect(() => {
    if (form.priceMode === 0) {
      loadDefaults();
    }
  }, [form.priceMode]);

  return (
    <div className={styles.wrapper}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "catalyst" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("catalyst")}
        >
          <Calculator size={18} />
          {t("calculator.tabs.catalyst")}
        </button>
        <button
          className={`${styles.tab} ${activeTab === "dollar" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("dollar")}
        >
          <DollarSign size={18} />
          {t("calculator.tabs.dollar")}
        </button>
      </div>

      {/* Catalyst Calculator */}
      {activeTab === "catalyst" && (
        <div className={styles.calculatorContent}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Calculator size={24} style={{ marginRight: '8px' }} />
          {t("calculator.title")}
        </h2>

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
            <Weight size={18} />
            {t("calculator.columns.weight")}
          </h3>

          <label>
            <Weight size={14} /> {t("calculator.form.powderKg")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.powderKg")}
            type="number"
            value={displayValue("powderKg")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("powderKg", e.target.value)}
          />

          <label>
            <Scale size={14} /> {t("calculator.form.pt_g")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.pt_g")}
            type="number"
            value={displayValue("pt_g")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("pt_g", e.target.value)}
          />

          <label>
            <Scale size={14} /> {t("calculator.form.pd_g")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.pd_g")}
            type="number"
            value={displayValue("pd_g")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("pd_g", e.target.value)}
          />

          <label>
            <Scale size={14} /> {t("calculator.form.rh_g")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.rh_g")}
            type="number"
            value={displayValue("rh_g")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("rh_g", e.target.value)}
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
            <DollarSign size={18} />
            {t("calculator.columns.price")}
            {!isManualMode && (
              <span className={styles.autoBadge}>{t("calculator.liveBadge")}</span>
            )}
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
            value={displayValue("ptPrice")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("ptPrice", e.target.value)}
          />

          <label>
            <DollarSign size={14} /> {t("calculator.form.pdPrice")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.pdPrice")}
            type="number"
            disabled={!isManualMode}
            value={displayValue("pdPrice")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("pdPrice", e.target.value)}
          />

          <label>
            <DollarSign size={14} /> {t("calculator.form.rhPrice")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.rhPrice")}
            type="number"
            disabled={!isManualMode}
            value={displayValue("rhPrice")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("rhPrice", e.target.value)}
          />

          <label>
            <DollarSign size={14} /> {t("calculator.form.exchange")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.exchange")}
            type="number"
            disabled={!isManualMode}
            value={displayValue("usdRate")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("usdRate", e.target.value)}
          />

          <label>
            <CoinsIcon size={14} /> {t("calculator.form.customerBonus")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.customerBonus")}
            type="number"
            disabled={!isManualMode}
            value={displayValue("customerBonusPercent")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              update("customerBonusPercent", e.target.value)
            }
          />

          <label>
            <CoinsIcon size={14} /> {t("calculator.form.minProfit")}
          </label>
          <TextField
            placeholder={t("calculator.placeholder.minProfit")}
            type="number"
            disabled={!isManualMode}
            value={displayValue("minProfitMarginPercent")}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
            <BarChart3 size={18} />
            {t("calculator.columns.result")}
          </h3>

          {!result ? (
            <div className={styles.loaderWrapper}>
              <div
                className={`${styles.loader} ${
                  loading ? styles.loaderActive : styles.loaderIdle
                }`}
              />
              <span className={styles.loaderText}>
                {loading
                  ? t("calculator.form.button.calculating")
                  : t("calculator.columns.noResult")}
              </span>
            </div>
          ) : (
            <>
              <div className={styles.resultGrid}>
                <div>
                  <span>{t("calculator.form.offer")}</span>
                  <b>{result.customerOfferAmd.toFixed(2)}</b>
                </div>

                <div>
                  <span>{t("calculator.form.maxCustomerPercent")}</span>
                  <b>{result.maxCustomerPercent.toFixed(2)}%</b>
                </div>
              </div>

              {showHiddenItems && (
                <div className={styles.resultGrid}>
                  <div>
                    <span>{t("calculator.form.kitko")}</span>
                    <b>{result.kitcoAmd.toFixed(2)}</b>
                  </div>

                  <div>
                    <span>{t("calculator.form.finalBase")}</span>
                    <b>{result.finalBaseAmd.toFixed(2)}</b>
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

              <button
                className={`${styles.toggleButton} ${showHiddenItems ? styles.expanded : ""}`}
                onClick={() => setShowHiddenItems(!showHiddenItems)}
                title={showHiddenItems ? "Hide details" : "Show details"}
              >
                <ChevronDown size={16} />
              </button>
            </>
          )}
        </div>
      </div>
        </div>
      )}

      {/* Dollar Calculator */}
      {activeTab === "dollar" && (
        <div className={styles.calculatorContent}>
          <div className={styles.header}>
            <h2 className={styles.title}>
              <DollarSign size={24} style={{ marginRight: '8px' }} />
              {t("dollarCalculator.title")}
            </h2>
          </div>

          <div className={styles.cardsGrid}>
            {/* Inputs Card */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <Weight size={18} />
                {t("dollarCalculator.columns.input")}
              </h3>

              <label>
                <Weight size={14} /> {t("dollarCalculator.form.powderKg")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.powderKg")}
                type="number"
                value={dollarDisplayValue("powderKg")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("powderKg", e.target.value)}
              />

              <label>
                <Scale size={14} /> {t("dollarCalculator.form.pt_g")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.pt_g")}
                type="number"
                value={dollarDisplayValue("pt_g")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("pt_g", e.target.value)}
              />

              <label>
                <Scale size={14} /> {t("dollarCalculator.form.pd_g")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.pd_g")}
                type="number"
                value={dollarDisplayValue("pd_g")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("pd_g", e.target.value)}
              />

              <label>
                <Scale size={14} /> {t("dollarCalculator.form.rh_g")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.rh_g")}
                type="number"
                value={dollarDisplayValue("rh_g")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("rh_g", e.target.value)}
              />

              <label>
                <DollarSign size={14} /> {t("dollarCalculator.form.ptPrice")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.ptPrice")}
                type="number"
                value={dollarDisplayValue("ptPrice")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("ptPrice", e.target.value)}
              />

              <label>
                <DollarSign size={14} /> {t("dollarCalculator.form.pdPrice")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.pdPrice")}
                type="number"
                value={dollarDisplayValue("pdPrice")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("pdPrice", e.target.value)}
              />

              <label>
                <DollarSign size={14} /> {t("dollarCalculator.form.rhPrice")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.rhPrice")}
                type="number"
                value={dollarDisplayValue("rhPrice")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("rhPrice", e.target.value)}
              />
            </div>

            {/* Reduction & Options Card */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <CoinsIcon size={18} />
                {t("dollarCalculator.columns.reduction")}
              </h3>

              <label>
                <Scale size={14} /> {t("dollarCalculator.form.ptReduce")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.percent")}
                type="number"
                value={dollarDisplayValue("ptReducePercent")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("ptReducePercent", e.target.value)}
              />

              <label>
                <Scale size={14} /> {t("dollarCalculator.form.pdReduce")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.percent")}
                type="number"
                value={dollarDisplayValue("pdReducePercent")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("pdReducePercent", e.target.value)}
              />

              <label>
                <Scale size={14} /> {t("dollarCalculator.form.rhReduce")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.percent")}
                type="number"
                value={dollarDisplayValue("rhReducePercent")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("rhReducePercent", e.target.value)}
              />

              <label>
                <CoinsIcon size={14} /> {t("dollarCalculator.form.salePercent")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.percent")}
                type="number"
                value={dollarDisplayValue("salePercent")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("salePercent", e.target.value)}
              />

              <label>
                <Weight size={14} /> {t("dollarCalculator.form.moisture")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.percent")}
                type="number"
                value={dollarDisplayValue("moisturePercent")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("moisturePercent", e.target.value)}
              />

              <label>
                <DollarSign size={14} /> {t("dollarCalculator.form.dollarCost")}
              </label>
              <TextField
                placeholder={t("dollarCalculator.placeholder.dollarCost")}
                type="number"
                value={dollarDisplayValue("dollarCostPerKg")}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => dollarUpdate("dollarCostPerKg", e.target.value)}
              />

              <div className={styles.actions}>
                <Button onClick={onDollarCalculate} disabled={dollarLoading} fullWidth>
                  <Calculator size={18} />
                  {dollarLoading ? t("dollarCalculator.form.button.calculating") : t("dollarCalculator.form.button.calculate")}
                </Button>

                <Button variant="secondary" onClick={onDollarCancel} fullWidth>
                  {t("dollarCalculator.form.button.cancel")}
                </Button>
              </div>
            </div>

            {/* Results Card */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <BarChart3 size={18} />
                {t("dollarCalculator.columns.result")}
              </h3>

              {!dollarResult ? (
                <div className={styles.loaderWrapper}>
                  <div
                    className={`${styles.loader} ${
                      dollarLoading ? styles.loaderActive : styles.loaderIdle
                    }`}
                  />
                  <span className={styles.loaderText}>
                    {dollarLoading ? t("dollarCalculator.form.button.calculating") : t("dollarCalculator.result.noResult")}
                  </span>
                </div>
              ) : (
                <>
                  <div className={styles.resultGrid}>
                    <div>
                      <span>{t("dollarCalculator.result.kitcoPricePerKg")}</span>
                      <b>${dollarResult.kitcoPricePerKgUsd.toFixed(2)}</b>
                    </div>

                    <div>
                      <span>{t("dollarCalculator.result.kitcoTotal")}</span>
                      <b>${dollarResult.kitcoTotalUsd.toFixed(2)}</b>
                    </div>

                    <div>
                      <span>{t("dollarCalculator.result.originalPowder")}</span>
                      <b>{dollarResult.originalPowderKg.toFixed(2)} kg</b>
                    </div>

                    <div>
                      <span>{t("dollarCalculator.result.actualPowder")}</span>
                      <b>{dollarResult.actualPowderKg.toFixed(2)} kg</b>
                    </div>

                    {dollarResult.dollarCostPerKgUsd > 0 && (
                      <>
                        <div>
                          <span>{t("dollarCalculator.result.dollarCostPerKg")}</span>
                          <b>${dollarResult.dollarCostPerKgUsd.toFixed(2)}</b>
                        </div>

                        <div>
                          <span>{t("dollarCalculator.result.totalDollarCost")}</span>
                          <b>${dollarResult.totalDollarCostUsd.toFixed(2)}</b>
                        </div>
                      </>
                    )}

                    <div style={{ gridColumn: "1 / -1", marginTop: "12px", padding: "16px", background: "rgba(34, 197, 94, 0.1)", borderRadius: "8px", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                      <span style={{ fontSize: "14px", opacity: 0.8 }}>{t("dollarCalculator.result.finalTotal")}</span>
                      <b style={{ display: "block", fontSize: "24px", color: "#22c55e", marginTop: "4px" }}>
                        ${dollarResult.finalTotalUsd.toFixed(2)}
                      </b>
                    </div>
                  </div>

                  <div className={styles.totalsWrapper} style={{ marginTop: "20px" }}>
                    <div className={styles.totalsSection}>
                      <div className={styles.totalsHeader}>
                        {t("dollarCalculator.result.metalsPerKg")}
                      </div>
                      <div className={styles.totalsGrid}>
                        <div className={styles.totalCard}>
                          <span>Pt</span>
                          <b>{dollarResult.pt_g.toFixed(3)}</b>
                          <small>g/kg</small>
                        </div>
                        <div className={styles.totalCard}>
                          <span>Pd</span>
                          <b>{dollarResult.pd_g.toFixed(3)}</b>
                          <small>g/kg</small>
                        </div>
                        <div className={styles.totalCard}>
                          <span>Rh</span>
                          <b>{dollarResult.rh_g.toFixed(3)}</b>
                          <small>g/kg</small>
                        </div>
                      </div>
                    </div>

                    <div className={styles.totalsSection}>
                      <div className={styles.totalsHeader}>
                        {t("dollarCalculator.result.metalsTotal")}
                      </div>
                      <div className={styles.totalsGrid}>
                        <div className={styles.totalCard}>
                          <span>Pt</span>
                          <b>{dollarResult.totalPt_g.toFixed(2)}</b>
                          <small>g</small>
                        </div>
                        <div className={styles.totalCard}>
                          <span>Pd</span>
                          <b>{dollarResult.totalPd_g.toFixed(2)}</b>
                          <small>g</small>
                        </div>
                        <div className={styles.totalCard}>
                          <span>Rh</span>
                          <b>{dollarResult.totalRh_g.toFixed(2)}</b>
                          <small>g</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
