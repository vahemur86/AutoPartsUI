import {
  useCallback,
  useEffect,
  useRef,
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
  CircleDollarSign,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";

// ui-kit
import { Button, ConfirmationModal } from "@/ui-kit";

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
  hidePrice?: boolean;
  withRecalculate?: boolean;
  isCatalyst?: boolean;
  isIronPurchase?: boolean;
  ironItems?: Array<{
    dictBrandId?: number;
    categoryId?: number | null;
    categoryName?: string | null;
    brandName?: string;
    ironTypeId: number;
    name: string;
    pricePerKg: number;
    weightKg: number;
    totalAmount: number;
    recalculationStep?: number | null;
    appliedRecalculationStep?: number | null;
  }>;
  ironTotals?: {
    weightKgTotal: number;
    totalAmountTotal: number;
  };
  recalculationResult?: {
    currentStep: number;
    nextStep: number;
    appliedStep: number;
    isLastStep: boolean;
    totalWeight: number;
    totalAmount: number;
    items: Array<{
      ironTypeId: number;
      weightKg: number;
      pricePerKg: number | null;
      totalAmount: number;
      dictBrandId?: number;
      categoryId?: number;
      recalculationStep?: number | null;
      appliedRecalculationStep?: number | null;
    }>;
  } | null;
  onReset?: () => void;
  onAccept?: () => Promise<void>;
  acceptLabel?: string;
  onRecalculate?: () => Promise<void>;
  isLoading?: boolean;
  isDisabled?: boolean;
  setRecalculationsAmount?: Dispatch<SetStateAction<number>>;
}> = ({
  isRecalculationsLimitReached = false,
  hidePrice = false,
  withRecalculate = false,
  isCatalyst = false,
  isIronPurchase = false,
  offerPrice = 0,
  agentPayment,
  currencyCode = "AMD",
  userData = {},
  ironItems,
  ironTotals,
  recalculationResult,
  onReset,
  onAccept,
  acceptLabel,
  onRecalculate,
  isLoading = false,
  isDisabled = false,
  setRecalculationsAmount,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { intake, newPropose } = useAppSelector((state) => state.operator);

  const [isOffering, setIsOffering] = useState(false);
  const [isInternalRecalculating, setIsInternalRecalculating] = useState(false);
  const [offerConfirmed, setOfferConfirmed] = useState(false);
  const [purchaseSuccessAmount, setPurchaseSuccessAmount] = useState<number | null>(null);

  useEffect(() => {
    setOfferConfirmed(false);
  }, [intake?.id]);

  const handleOffer = useCallback(async () => {
    if (isDisabled || offerConfirmed || isOffering) return;

    if (onAccept) {
      setIsOffering(true);
      try {
        await onAccept();
        setOfferConfirmed(true);
        setPurchaseSuccessAmount(Number(offerPrice));
      } catch {
        setOfferConfirmed(false);
      } finally {
        setIsOffering(false);
      }
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
  }, [
    dispatch,
    intake,
    t,
    userData?.cashRegisterId,
    onAccept,
    offerPrice,
    agentPayment,
    newPropose,
    offerConfirmed,
    isOffering,
    isDisabled,
  ]);

  const handleRecalculateAction = useCallback(async () => {
    if (isDisabled || agentPayment?.isAgent) return;
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
    isDisabled,
  ]);

  const isAnyActionLoading = isOffering || isInternalRecalculating || isLoading;

  const lineItems = recalculationResult?.items?.map((item) => {
    const source = ironItems?.find((ironItem) =>
      (item.categoryId != null
        ? ironItem.categoryId === item.categoryId
        : ironItem.dictBrandId === item.dictBrandId) &&
      ironItem.ironTypeId === item.ironTypeId &&
      (ironItem.recalculationStep ?? null) === (item.recalculationStep ?? null),
    );
    return {
      ...item,
      brandName: source?.brandName ?? source?.categoryName ?? undefined,
      name: source?.name ?? `#${item.ironTypeId}`,
    };
  }) ?? ironItems;
  const totalWeight = recalculationResult?.totalWeight ?? ironTotals?.weightKgTotal;
  const totalAmount = recalculationResult?.totalAmount ?? ironTotals?.totalAmountTotal;
  const isAgent = agentPayment?.isAgent === true;
  const hasNewCatalystOffer = !isAgent && !!newPropose;
  const displayPrice = isAgent
    ? agentPayment.powderValueAmd
    : hasNewCatalystOffer
    ? newPropose.offeredAmountAmd
    : offerPrice;
  const previousDisplayPrice = useRef(displayPrice);
  const [priceAnimationKey, setPriceAnimationKey] = useState(0);

  useEffect(() => {
    if (previousDisplayPrice.current === displayPrice) return;

    previousDisplayPrice.current = displayPrice;
    setPriceAnimationKey((key) => key + 1);
  }, [displayPrice]);

  const isTransactionReady = onAccept
    ? offerPrice > 0 && (!isIronPurchase || recalculationResult != null)
    : !!intake;

  return (
    <>
    <div className={`${styles.finalOfferCard} ${isIronPurchase ? styles.ironPurchaseCard : ""}`}>
      <div className={styles.finalOfferContent}>
        <div className={`${styles.finalOfferLabel} ${isIronPurchase ? styles.ironFinalOfferLabel : ""}`}>
          {isIronPurchase && (
            <span className={styles.finalOfferTitleIcon} aria-hidden="true">
              <CircleDollarSign size={16} />
            </span>
          )}
          <span>{isAgent ? t("finalOffer.agentAccounting.powderValue") : t("finalOffer.title")}</span>
        </div>
        {!hidePrice && (
          <div className={styles.priceContainer}>
            {hasNewCatalystOffer && (
              <div className={styles.oldPriceStruck}>
                {offerPrice.toLocaleString()} {currencyCode}
              </div>
            )}
            <div
              key={priceAnimationKey}
              className={`${styles.finalOfferAmount} ${
                priceAnimationKey > 0 ? styles.priceUpdated : ""
              } ${
                hasNewCatalystOffer ? styles.newPriceHighlight : ""
              }`}
            >
              {displayPrice.toLocaleString()} {currencyCode}
            </div>
          </div>
        )}
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
                <div key={`${item.dictBrandId ?? item.categoryId ?? 0}-${item.ironTypeId}-${item.recalculationStep ?? 0}`} className={styles.calculationSummaryRow}>
                  <div className={styles.calculationSummaryIdentity}>
                    <strong>{item.name}</strong>
                    {item.brandName && <span>{item.brandName}</span>}
                  </div>
                  <span className={styles.calculationSummaryStep}>
                    {(item.appliedRecalculationStep ?? item.recalculationStep) == null
                      ? t("operatorPage.ironCarShop.regularPrice", "Regular price")
                      : t("operatorPage.ironCarShop.stepLabel", { step: item.appliedRecalculationStep ?? item.recalculationStep })}
                  </span>
                  <span className={styles.calculationSummaryFormula}>
                    {t("operatorPage.ironCarShop.weightEstimate", {
                      weight: item.weightKg,
                      price: item.pricePerKg?.toLocaleString() ?? t("operatorPage.ironCarShop.priceNotConfigured"),
                      total: item.totalAmount.toLocaleString(),
                    })}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.calculationSummaryTotals}>
              <span>{t("operatorPage.ironCarShop.total")}</span>
              <span className={styles.calculationSummaryTotalValues}>
                <small>{totalWeight ?? 0} kg</small>
                <strong>{totalAmount?.toLocaleString() ?? 0} AMD</strong>
              </span>
            </div>
          </div>
        )}
        <div className={styles.finalOfferActions}>
          <Button
            variant="primary"
            size="small"
            fullWidth
            className={isIronPurchase ? styles.ironPurchaseAction : isCatalyst ? sharedStyles.catalystPrimaryAction : undefined}
            onClick={handleOffer}
            disabled={isDisabled || offerConfirmed || isAnyActionLoading || !isTransactionReady}
          >
            <Check size={20} />
            {acceptLabel ?? t("finalOffer.offerButton")}
          </Button>

          {withRecalculate && !isAgent && (
            <Button
              variant="secondary"
              size="small"
              fullWidth
              onClick={handleRecalculateAction}
              disabled={
                isRecalculationsLimitReached ||
                isDisabled ||
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
            disabled={isDisabled || isAnyActionLoading || !isTransactionReady}
          >
            <X size={20} />
            {t("finalOffer.rejectButton")}
          </Button>
        </div>
      </div>
    </div>
    <ConfirmationModal
      open={purchaseSuccessAmount !== null}
      onOpenChange={(open) => {
        if (!open) setPurchaseSuccessAmount(null);
      }}
      title={t("operatorPage.success.purchaseCompleted")}
      description={t("operatorPage.success.transactionConfirmed")}
      confirmText={t("operatorPage.success.continue")}
      cancelText={t("common.close")}
      confirmVariant="primary"
      confirmClassName={styles.purchaseSuccessButton}
      cancelClassName={styles.purchaseSuccessCloseButton}
      confirmIcon={<ShoppingBag size={17} aria-hidden="true" />}
      onConfirm={() => setPurchaseSuccessAmount(null)}
      onCancel={() => setPurchaseSuccessAmount(null)}
      className={styles.purchaseSuccessModal}
    >
      {purchaseSuccessAmount !== null && (
        <div className={styles.purchaseSuccessContent}>
          <div className={styles.purchaseSuccessIcon} aria-hidden="true">
            <CheckCircle2 size={40} strokeWidth={1.8} />
          </div>
          <strong className={styles.purchaseSuccessMessage}>
            {t("operatorPage.success.purchaseCompleted")}
          </strong>
          <div className={styles.purchaseSuccessAmount}>
            <span>{t("operatorPage.ironCarShop.totalAmount")}</span>
            <strong>{purchaseSuccessAmount.toLocaleString()} AMD</strong>
          </div>
        </div>
      )}
    </ConfirmationModal>
    </>
  );
};
