import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { ConfirmationModal } from "@/ui-kit";
import { useOperator } from "@/pages/Operator/hooks";
import { CashierMode, OperatorHeader, TopUpConfirmationModal } from "@/pages/Operator/components";
import styles from "./ShopOperatorPage.module.css";

export const ShopOperatorPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    uiState,
    setUiState,
    userData,
    languages,
    currentLanguageCode,
    actions,
    selectors,
  } = useOperator();

  const { t } = useTranslation();

  const displayBalance = useMemo(() => {
    if (selectors.cashRegisters.isBalanceLoading)
      return t("cashRegisters.fetchingBalance");
    if (!uiState.showCashAmount) return "••••••••";

    return Number(
      selectors.cashRegisters.activeBalance?.balance || 0,
    ).toLocaleString();
  }, [selectors.cashRegisters.isBalanceLoading, selectors.cashRegisters.activeBalance?.balance, uiState.showCashAmount, t]);

  return (
    <div className={styles.page}>
      <OperatorHeader
        hasOpenSession={selectors.cashSessions.hasOpenSession}
        onToggleSession={actions.handleToggleSession}
        onOpenCloseModal={() =>
          setUiState((p) => ({ ...p, isCloseSessionModalOpen: true }))
        }
        onOpenLogoutModal={() =>
          setUiState((p) => ({ ...p, isLogoutModalOpen: true }))
        }
        languages={languages}
        selectedApiCode={currentLanguageCode}
        onLanguageChange={actions.handleLanguageChange}
        isLangLoading={selectors.languagesState.isLoading}
        displayBalance={displayBalance}
        userData={userData || {}}
        showCashAmount={uiState.showCashAmount}
        onToggleVisibility={() =>
          setUiState((p) => ({ ...p, showCashAmount: !uiState.showCashAmount }))
        }
        hasError={!!selectors.cashRegisters.balanceError}
      />

      <div className={styles.contentArea}>
        <CashierMode cashRegisterId={userData?.cashRegisterId} />
      </div>

      {!!selectors.cashRegisters.pendingDetails && (
        <TopUpConfirmationModal
          open={!!selectors.cashRegisters.pendingDetails}
          data={selectors.cashRegisters.pendingDetails}
          onConfirm={actions.handleConfirmTopUp}
          isLoading={selectors.cashRegisters.isPendingLoading}
        />
      )}

      {uiState.isCloseSessionModalOpen && (
        <ConfirmationModal
          open={uiState.isCloseSessionModalOpen}
          onOpenChange={(v) =>
            setUiState((p) => ({ ...p, isCloseSessionModalOpen: v }))
          }
          title={t("operatorPage.closeSession")}
          description={t("common.areYouSure")}
          onConfirm={() => actions.handleToggleSession("close")}
          onCancel={() =>
            setUiState((p) => ({ ...p, isCloseSessionModalOpen: false }))
          }
        />
      )}

      {uiState.isLogoutModalOpen && (
        <ConfirmationModal
          open={uiState.isLogoutModalOpen}
          onOpenChange={(v) =>
            setUiState((p) => ({ ...p, isLogoutModalOpen: v }))
          }
          title={t("header.logout")}
          description={t("common.areYouSure")}
          onConfirm={() => {
            dispatch(logout());
            navigate("/login");
          }}
          onCancel={() =>
            setUiState((p) => ({ ...p, isLogoutModalOpen: false }))
          }
        />
      )}
    </div>
  );
};
