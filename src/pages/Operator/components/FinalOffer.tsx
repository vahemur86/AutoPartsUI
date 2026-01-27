import { useCallback, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Button } from "@/ui-kit";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { offerIntake, rejectIntake } from "@/store/slices/operatorSlice";
import type { IntakeResponse } from "@/types/operator";
import styles from "../OperatorPage.module.css";

export const FinalOffer: FC<{
  offerPrice: number;
  currencyCode?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: any;
  onReset?: () => void;
}> = ({ offerPrice = 0, currencyCode = "AMD", userData = {}, onReset }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { intake } = useAppSelector((state) => state.operator);
  const [isOffering, setIsOffering] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleOffer = useCallback(async () => {
    const currentIntake: IntakeResponse | null = intake ?? null;

    if (!currentIntake) {
      toast.error(t("finalOffer.error.noIntake"));
      return;
    }

    const intakeId = currentIntake.id;

    if (!intakeId) {
      toast.error(t("finalOffer.error.noIntakeId"));
      return;
    }

    try {
      setIsOffering(true);
      await dispatch(
        offerIntake({
          intakeId,
          cashRegisterId: userData?.cashRegisterId,
        }),
      ).unwrap();
      toast.success(t("finalOffer.success.offered"));
    } catch (error: unknown) {
      console.error("Error offering intake:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("finalOffer.error.failedToOffer");
      toast.error(errorMessage);
    } finally {
      setIsOffering(false);
    }
  }, [dispatch, intake, t, userData?.cashRegisterId]);

  const handleReject = useCallback(async () => {
    const currentIntake: IntakeResponse | null = intake ?? null;

    if (!currentIntake) {
      toast.error(t("finalOffer.error.noIntake"));
      return;
    }

    const intakeId = currentIntake.id;

    if (!intakeId) {
      toast.error(t("finalOffer.error.noIntakeId"));
      return;
    }

    try {
      setIsRejecting(true);
      await dispatch(
        rejectIntake({ intakeId, cashRegisterId: userData?.cashRegisterId }),
      ).unwrap();

      toast.success(t("finalOffer.success.rejected"));

      onReset?.();
    } catch (error: unknown) {
      console.error("Error rejecting intake:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("finalOffer.error.failedToReject");
      toast.error(errorMessage);
    } finally {
      setIsRejecting(false);
    }
  }, [dispatch, intake, t, userData?.cashRegisterId, onReset]);

  return (
    <div className={styles.finalOfferCard}>
      <div className={styles.finalOfferContent}>
        <div className={styles.finalOfferLabel}>{t("finalOffer.title")}</div>
        <div className={styles.finalOfferAmount}>
          {offerPrice} {currencyCode}
        </div>

        <div className={styles.divider} />

        <div className={styles.finalOfferActions}>
          <Button
            variant="primary"
            size="small"
            fullWidth
            onClick={handleOffer}
            disabled={isOffering || isRejecting || !intake}
          >
            <Check size={20} />
            {t("finalOffer.offerButton")}
          </Button>
          <Button
            variant="secondary"
            size="small"
            fullWidth
            onClick={handleReject}
            disabled={isOffering || isRejecting || !intake}
          >
            <X size={20} />
            {t("finalOffer.rejectButton")}
          </Button>
        </div>
      </div>
    </div>
  );
};
