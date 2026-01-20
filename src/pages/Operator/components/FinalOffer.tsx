import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Button } from "@/ui-kit";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { offerIntake, rejectIntake } from "@/store/slices/operatorSlice";
import type { Intake } from "@/types/operator";
import styles from "../OperatorPage.module.css";

export const FinalOffer = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { intake } = useAppSelector((state) => state.operator);
  const [isOffering, setIsOffering] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleOffer = useCallback(async () => {
    const currentIntake: Intake | null = intake ?? null;

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
      await dispatch(offerIntake(intakeId)).unwrap();
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
  }, [dispatch, intake, t]);

  const handleReject = useCallback(async () => {
    const currentIntake: Intake | null = intake ?? null;

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
      await dispatch(rejectIntake(intakeId)).unwrap();
      toast.success(t("finalOffer.success.rejected"));
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
  }, [dispatch, intake, t]);

  return (
    <div className={styles.finalOfferCard}>
      <div className={styles.finalOfferContent}>
        <div className={styles.finalOfferLabel}>
          {t("finalOffer.title")}
        </div>
        <div className={styles.finalOfferAmount}>$35,640 USD</div>

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
