import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { agentPortalService } from "@/services/agentPortal";
import { ConfirmationModal } from "@/ui-kit";
import { useOperator } from "@/pages/Operator/hooks";
import { CashierMode, OperatorHeader, TopUpConfirmationModal } from "@/pages/Operator/components";
import { CashierNotifications } from "@/pages/AgentPortal/CashierNotifications";
import styles from "./ShopOperatorPage.module.css";
import { CallingHistory } from "@/components/calling/CallingHistory";

export const ShopOperatorPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userRole = useAppSelector((state) => state.auth.user?.role.toLowerCase());
  const accessToken = useAppSelector((state) => state.auth.token);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
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
  const openCashierRequest = useCallback((requestId: string) => {
    navigate(`/shop-operator/agent-order-requests?requestId=${encodeURIComponent(requestId)}`);
  }, [navigate]);
  const refreshPendingRequests = useCallback(async () => {
    try {
      const pendingRequests = await agentPortalService.getCashierOrderRequests("Pending", 1, 50);
      setPendingRequestCount(pendingRequests.totalItems);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("agentPortal.loadError"));
    }
  }, [t]);

  useEffect(() => {
    if (userRole === "cashier") void refreshPendingRequests();
  }, [refreshPendingRequests, userRole]);

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
        {userRole === "cashier" && (
          <div className={styles.cashierActions}>
            <Link
              to="/shop-operator/agent-order-requests"
              className={styles.agentRequestsLink}
              aria-label={t("agentPortal.cashierNotifications.pendingRequestsCount", { count: pendingRequestCount })}
            >
              <ClipboardList size={17} aria-hidden="true" />
              {pendingRequestCount > 0 && <span className={styles.pendingRequestCount}>{pendingRequestCount > 99 ? "99+" : pendingRequestCount}</span>}
            </Link>
            <CashierNotifications
              accessToken={accessToken}
              onOpenRequest={openCashierRequest}
              onRefreshPendingRequests={refreshPendingRequests}
            />
          </div>
        )}
        <CashierMode cashRegisterId={userData?.cashRegisterId} />
        {userRole === "cashier" && <CallingHistory />}
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
          onConfirm={async () => {
            await dispatch(logout());
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
