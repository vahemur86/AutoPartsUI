import { useEffect, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  confirmOtp,
  requestOtp,
  resetOtpState,
} from "@/store/slices/verificationOTPSlice";
import { Button } from "@/ui-kit";
import styles from "./OtpGateProvider.module.css";
import { t } from "i18next";

interface OtpCallbacks {
  onVerified: () => void;
  onCancel: () => void;
}

export const OtpGateProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const {
    isLoading: otpLoading,
    currentStep: otpStep,
    error: otpError,
  } = useAppSelector((state) => state.otp);

  const [visible, setVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [callbacks, setCallbacks] = useState<OtpCallbacks | null>(null);
  const [otpValue, setOtpValue] = useState("");

  useEffect(() => {
    const handler = (e: Event) => {
      const event = e as CustomEvent<OtpCallbacks>;
      setVisible(true);
      setIsLocked(false);
      setCallbacks(event.detail);
      dispatch(resetOtpState());
      setOtpValue("");
    };

    window.addEventListener("otp:required", handler as EventListener);
    return () =>
      window.removeEventListener("otp:required", handler as EventListener);
  }, [dispatch]);

  const handleRequestOtp = async () => {
    try {
      await dispatch(requestOtp({ pageUrl: window.location.href })).unwrap();
      toast.success("OTP sent successfully!");
    } catch (err: unknown) {
      toast.error(typeof err === "string" ? err : "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue.trim()) return;
    try {
      await dispatch(
        confirmOtp({ otp: otpValue, pageUrl: window.location.href }),
      ).unwrap();

      toast.success("OTP verified successfully!");
      setVisible(false);
      setIsLocked(false);
      setOtpValue("");
      if (callbacks?.onVerified) {
        callbacks.onVerified();
      }

      dispatch(resetOtpState());
    } catch (err: unknown) {}
  };

  const handleCancel = () => {
    setVisible(false);
    setIsLocked(true);
    if (callbacks?.onCancel) callbacks.onCancel();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className={styles.appContainer}>
      {!visible && !isLocked ? (
        <div className={styles.pageContent}>{children}</div>
      ) : null}
      {visible && (
        <div className={styles.otpCardContainer}>
          <div className={styles.otpCard}>
            <h2 className={styles.otpTitle}>{t("OTP.title")}</h2>
            <p className={styles.otpDescription}>{t("OTP.description")}</p>

            {otpStep !== "code_sent" ? (
              <Button
                variant="primary"
                size="large"
                onClick={handleRequestOtp}
                disabled={otpLoading}
                className={styles.otpButton}
              >
                {otpLoading ? t("OTP.sendingOtp") : t("OTP.requestOtp")}
              </Button>
            ) : (
              <div className={styles.otpInputWrapper}>
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                  className={styles.otpInput}
                  placeholder="••••••"
                  autoFocus
                />
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading}
                  className={styles.otpButton}
                >
                  {t("OTP.verifyOtp")}
                </Button>
              </div>
            )}

            {otpError && <div className={styles.otpError}>{otpError}</div>}

            <button className={styles.cancelLink} onClick={handleCancel}>
              {t("OTP.cancel")}
            </button>
          </div>
        </div>
      )}

      {isLocked && (
        <div className={styles.otpCardContainer}>
          <div className={styles.otpCard}>
            <h2 className={styles.otpTitle}>{t("OTP.accessDenied")}</h2>
            <p className={styles.otpDescription}>
              {t("OTP.requiredVerification")}
            </p>
            <Button
              variant="primary"
              size="large"
              onClick={handleGoHome}
              className={styles.otpButton}
            >
              {t("OTP.goBack")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
