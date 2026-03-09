import {
  useCallback,
  useState,
  type FC,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// icons
import { Check, X, RotateCcw } from "lucide-react";

// ui-kit
import { Button } from "@/ui-kit";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { offerIntake, proposeNewOffer } from "@/store/slices/operatorSlice";

// styles
import styles from "./FinalOffer.module.css";
import sharedStyles from "../../OperatorPage.module.css";

export const FinalOffer: FC<{
  offerPrice: number;
  currencyCode?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: any;
  isRecalculationsLimitReached?: boolean;
  withRecalculate?: boolean;
  onReset?: () => void;
  onAccept?: () => Promise<void>;
  onRecalculate?: () => Promise<void>;
  isLoading?: boolean;
  setRecalculationsAmount?: Dispatch<SetStateAction<number>>;
}> = ({
  isRecalculationsLimitReached = false,
  withRecalculate = false,
  offerPrice = 0,
  currencyCode = "AMD",
  userData = {},
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

  const handleOffer = useCallback(async () => {
    if (onAccept) {
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
      toast.success(t("finalOffer.success.offered"));
    } catch (error) {
      console.error("Offer failed:", error);
    } finally {
      setIsOffering(false);
    }
  }, [dispatch, intake, t, userData?.cashRegisterId, onAccept]);

  const handleRecalculateAction = useCallback(async () => {
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
  ]);

  const isAnyActionLoading = isOffering || isInternalRecalculating || isLoading;

  const hasNewCatalystOffer = !!newPropose;
  const displayPrice = hasNewCatalystOffer
    ? newPropose.offeredAmountAmd
    : offerPrice;

  const isTransactionReady = onAccept ? offerPrice > 0 : !!intake;

  return (
    <div className={styles.finalOfferCard}>
      <div className={styles.finalOfferContent}>
        <div className={styles.finalOfferLabel}>{t("finalOffer.title")}</div>
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
        <div className={styles.finalOfferActions}>
          <Button
            variant="primary"
            size="small"
            fullWidth
            onClick={handleOffer}
            disabled={isAnyActionLoading || !isTransactionReady}
          >
            <Check size={20} />
            {t("finalOffer.offerButton")}
          </Button>

          {withRecalculate && (
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
