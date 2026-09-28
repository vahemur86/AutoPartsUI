import {
  useCallback,
  useEffect,
  useState,
  type FC,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// icons
import {
  Check,
  X,
  RotateCcw,
  Landmark,
  ArrowDownCircle,
  Wallet,
  TrendingDown,
} from "lucide-react";

// ui-kit
import { Button } from "@/ui-kit";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { offerIntake, proposeNewOffer } from "@/store/slices/operatorSlice";
import type { AgentPaymentPreview } from "@/types/operator";

// styles
import styles from "./FinalOffer.module.css";
import sharedStyles from "../../OperatorPage.module.css";

export const FinalOffer: FC<{
  offerPrice: number;
  agentPayment?: AgentPaymentPreview | null;
  currencyCode?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: any;
  isRecalculationsLimitReached?: boolean;
  withRecalculate?: boolean;
  ironItems?: Array<{
    ironTypeId: number;
    name: string;
    pricePerKg: number;
    weightKg: number;
    totalAmount: number;
  }>;
  ironTotals?: {
    weightKgTotal: number;
    totalAmountTotal: number;
  };
  recalculationResult?: {
    currentStep: number;
    nextStep: number;
    isLastStep: boolean;
    totalWeight: number;
    totalAmount: number;
    items: Array<{
      ironTypeId: number;
      weightKg: number;
      pricePerKg: number;
      totalAmount: number;
    }>;
  } | null;
  onReset?: () => void;
  onAccept?: () => Promise<void>;
  onRecalculate?: () => Promise<void>;
  isLoading?: boolean;
  setRecalculationsAmount?: Dispatch<SetStateAction<number>>;
}> = ({
  isRecalculationsLimitReached = false,
  withRecalculate = false,
  offerPrice = 0,
  agentPayment,
  currencyCode = "AMD",
  userData = {},
  ironItems,
  ironTotals,
  recalculationResult,
  onReset,
  onAccept,
  onRecalculate,
  isLoading = false,
  setRecalculationsAmount,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { intake, newPropose } = useAppSelector((state) => state.operator);

  const [isOffering, setIsOffering] = useState(false);
  const [isInternalRecalculating, setIsInternalRecalculating] = useState(false);
  const [offerConfirmed, setOfferConfirmed] = useState(false);

  useEffect(() => {
    setOfferConfirmed(false);
  }, [intake?.id]);

  const handleOffer = useCallback(async () => {
    if (offerConfirmed || isOffering) return;

    if (onAccept) {
      setOfferConfirmed(true);
      await onAccept();
      return;
    }

    const intakeId = intake?.id;
    if (!intakeId) return;
    try {
      setIsOffering(true);
      await dispatch(
        offerIntake({ intakeId, cashRegisterId: userData?.cashRegisterId }),
      ).unwrap();
      setOfferConfirmed(true);
      toast.success(t("finalOffer.success.offered"));
    } catch (error) {
      console.error("Offer failed:", error);
    } finally {
      setIsOffering(false);
    }
  }, [dispatch, intake, t, userData?.cashRegisterId, onAccept, offerConfirmed, isOffering]);

  const handleRecalculateAction = useCallback(async () => {
    if (agentPayment?.isAgent) return;
    if (onRecalculate) {
      await onRecalculate();
      return;
    }

    const intakeId = intake?.id;
    if (!intakeId) return;
    try {
      setIsInternalRecalculating(true);
      await dispatch(
        proposeNewOffer({ intakeId, cashRegisterId: userData?.cashRegisterId }),
      ).unwrap();
      setRecalculationsAmount?.((prev) => prev + 1);
      toast.success(t("finalOffer.success.recalculated"));
    } catch (error) {
      console.error("Recalculate failed:", error);
    } finally {
      setIsInternalRecalculating(false);
    }
  }, [
    dispatch,
    intake,
    t,
    userData?.cashRegisterId,
    setRecalculationsAmount,
    onRecalculate,
    agentPayment?.isAgent,
  ]);

  const isAnyActionLoading = isOffering || isInternalRecalculating || isLoading;

  const lineItems = recalculationResult?.items?.map((item) => ({
    ...item,
    name:
      ironItems?.find((ironItem) => ironItem.ironTypeId === item.ironTypeId)
        ?.name ??
      `#${item.ironTypeId}`,
  })) ?? ironItems;
  const totalWeight = recalculationResult?.totalWeight ?? ironTotals?.weightKgTotal;
  const totalAmount = recalculationResult?.totalAmount ?? ironTotals?.totalAmountTotal;
  const stepLabel = recalculationResult?.currentStep
    ? t("operatorPage.ironCarShop.stepLabel", {
        step: recalculationResult.currentStep,
      })
    : undefined;

  const isAgent = agentPayment?.isAgent === true;
  const hasNewCatalystOffer = !isAgent && !!newPropose;
  const displayPrice = isAgent
    ? agentPayment.powderValueAmd
    : hasNewCatalystOffer
    ? newPropose.offeredAmountAmd
    : offerPrice;

  const isTransactionReady = onAccept ? offerPrice > 0 : !!intake;

  return (
    <div className={styles.finalOfferCard}>
      <div className={styles.finalOfferContent}>
        <div className={styles.finalOfferLabel}>
          {isAgent ? t("finalOffer.agentAccounting.powderValue") : t("finalOffer.title")}
        </div>
        <div className={styles.priceContainer}>
          {hasNewCatalystOffer && (
            <div className={styles.oldPriceStruck}>
              {offerPrice.toLocaleString()} {currencyCode}
            </div>
          )}
          <div
            className={`${styles.finalOfferAmount} ${
              hasNewCatalystOffer ? styles.newPriceHighlight : ""
            }`}
          >
            {displayPrice.toLocaleString()} {currencyCode}
          </div>
        </div>
        <div className={sharedStyles.divider} />
        {isAgent && (
          <div className={styles.agentPaymentSummary}>
            <div className={styles.agentSummaryHeader}>
              <span>{t("finalOffer.agentAccounting.title")}</span>
            </div>
            <div className={styles.agentPayDivider} />
            <div className={styles.agentPaymentRow}>
              <div className={styles.agentPaymentLabel}>
                <Landmark size={15} className={styles.agentPaymentIcon} />
                <span>{t("finalOffer.agentAccounting.currentDebt")}</span>
              </div>
              <strong className={styles.agentPaymentValue}>
                {agentPayment.outstandingDebtAmd.toLocaleString()} AMD
              </strong>
            </div>
            <div className={styles.agentPaymentRow}>
              <div className={styles.agentPaymentLabel}>
                <ArrowDownCircle size={15} className={styles.agentPaymentIcon} />
                <span>{t("finalOffer.agentAccounting.debtRepayment")}</span>
              </div>
              <strong className={styles.agentPaymentValue}>
                {agentPayment.debtRepaymentAmd.toLocaleString()} AMD
              </strong>
            </div>
            <div className={`${styles.agentPaymentRow} ${styles.cashPayoutRow}`}>
              <div className={styles.agentPaymentLabel}>
                <Wallet size={15} className={styles.agentPaymentIcon} />
                <span>{t("finalOffer.agentAccounting.cashPayout")}</span>
              </div>
              <strong className={`${styles.agentPaymentValue} ${styles.cashPayoutValue}`}>
                {agentPayment.cashPayoutAmd.toLocaleString()} AMD
              </strong>
            </div>
            <div className={`${styles.agentPaymentRow} ${styles.remainingDebtRow}`}>
              <div className={styles.agentPaymentLabel}>
                <TrendingDown size={15} className={styles.agentPaymentIcon} />
                <span>{t("finalOffer.agentAccounting.remainingDebt")}</span>
              </div>
              <strong className={`${styles.agentPaymentValue} ${styles.remainingDebtValue}`}>
                {agentPayment.remainingDebtAmd.toLocaleString()} AMD
              </strong>
            </div>
          </div>
        )}
        {lineItems && lineItems.length > 0 && (
          <div className={styles.calculationSummary}>
            <div className={styles.calculationSummaryList}>
              {lineItems.map((item) => (
                <div key={item.ironTypeId} className={styles.calculationSummaryRow}>
                  <span>{item.name}</span>
                  <span>
                    {t("operatorPage.ironCarShop.lineFormat", {
                      name: item.name,
                      weight: item.weightKg,
                      price: item.pricePerKg.toLocaleString(),
                      total: item.totalAmount.toLocaleString(),
                    })}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.calculationSummaryTotals}>
              <strong>{t("operatorPage.ironCarShop.total")}: </strong>
              <span>
                {totalWeight ?? 0} kg — {totalAmount?.toLocaleString() ?? 0} AMD
              </span>
            </div>
            {stepLabel && (
              <div className={styles.calculationStepLabel}>{stepLabel}</div>
            )}
          </div>
        )}
        <div className={styles.finalOfferActions}>
          <Button
            variant="primary"
            size="small"
            fullWidth
            onClick={handleOffer}
            disabled={offerConfirmed || isAnyActionLoading || !isTransactionReady}
          >
            <Check size={20} />
            {t("finalOffer.offerButton")}
          </Button>

          {withRecalculate && !isAgent && (
            <Button
              variant="secondary"
              size="small"
              fullWidth
              onClick={handleRecalculateAction}
              disabled={
                isRecalculationsLimitReached ||
                isAnyActionLoading ||
                !isTransactionReady
              }
            >
              <RotateCcw size={20} />
              {t("finalOffer.recalculateButton")}
            </Button>
          )}

          <Button
            variant="danger"
            size="small"
            fullWidth
            onClick={onReset}
            disabled={isAnyActionLoading || !isTransactionReady}
          >
            <X size={20} />
            {t("finalOffer.rejectButton")}
          </Button>
        </div>
      </div>
    </div>
  );
};
