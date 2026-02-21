import { useNavigate } from "react-router-dom";
import i18n from "i18next";

// ui-kit
import { ConfirmationModal, Tab } from "@/ui-kit";

// components
import {
  FinalOffer,
  PricingBreakdown,
  CustomerDetails,
  PowderExtraction,
  LiveMarketPrices,
  OperatorHeader,
  TopUpConfirmationModal,
  BuyIron,
} from "./components";

// stores
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

// hooks
import { useOperator, type TabType } from "./hooks";

// utils
import { mapApiCodeToI18nCode } from "@/utils/languageMapping";

// styles
import styles from "./OperatorPage.module.css";

export const OperatorPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    activeTab,
    setActiveTab,
    uiState,
    setUiState,
    userData,
    formData,
    setFormData,
    initialOfferPrice,
    recalculationsAmount,
    setRecalculationsAmount,
    hasTriedCalculateIron,
    setHasTriedCalculateIron,
    pendingTab,
    setPendingTab,
    languages,
    usdAmdRate,
    selectors,
    actions,
  } = useOperator();

  const isIron = activeTab === "iron";

  const handleTabClick = (targetTab: TabType) => {
    if (activeTab === targetTab) return;
    const isFormDirty =
      formData.powderWeight !== "0" ||
      formData.customer.phone !== "" ||
      selectors.operator.intake !== null ||
      selectors.ironCarShop.ironPrices.length > 0;
    if (isFormDirty) {
      setPendingTab(targetTab);
      setUiState((prev) => ({ ...prev, isTabConfirmModalOpen: true }));
    } else {
      setActiveTab(targetTab);
    }
  };

  const displayBalance = selectors.cashRegisters.isBalanceLoading
    ? i18n.t("cashRegisters.fetchingBalance")
    : uiState.showCashAmount
      ? Number(
          selectors.cashRegisters.activeBalance?.balance || 0,
        ).toLocaleString()
      : "••••••••";

  return (
    <div className={styles.operatorPage}>
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
        selectedApiCode={
          languages.find((l) => mapApiCodeToI18nCode(l.code) === i18n.language)
            ?.code ?? ""
        }
        onLanguageChange={(e) => {
          const code = mapApiCodeToI18nCode(e.target.value);
          i18n.changeLanguage(code);
          localStorage.setItem("i18nextLng", code);
        }}
        isLangLoading={selectors.languagesState.isLoading}
        displayBalance={displayBalance}
        userData={userData}
        showCashAmount={uiState.showCashAmount}
        onToggleVisibility={() =>
          setUiState((p) => ({ ...p, showCashAmount: !uiState.showCashAmount }))
        }
        hasError={!!selectors.cashRegisters.error}
      />

      <div className={styles.tabWrapper}>
        <Tab
          variant="underline"
          active={activeTab === "catalyst"}
          text={i18n.t("operatorPage.tabs.catalyst")}
          onClick={() => handleTabClick("catalyst")}
        />
        <Tab
          variant="underline"
          active={activeTab === "iron"}
          text={i18n.t("operatorPage.tabs.iron")}
          onClick={() => handleTabClick("iron")}
        />
      </div>

      <div className={!isIron ? styles.topRow : styles.ironLayout}>
        {!isIron ? (
          <>
            <div className={styles.leftColumn}>
              <PowderExtraction
                weight={formData.powderWeight}
                onWeightChange={(v) =>
                  setFormData((p) => ({ ...p, powderWeight: v }))
                }
                error={
                  uiState.hasTriedSubmit && isNaN(Number(formData.powderWeight))
                }
              />
              <LiveMarketPrices
                ptPricePerGram={
                  selectors.metalRates.activeMetalRate?.ptPricePerGram
                }
                pdPricePerGram={
                  selectors.metalRates.activeMetalRate?.pdPricePerGram
                }
                rhPricePerGram={
                  selectors.metalRates.activeMetalRate?.rhPricePerGram
                }
                currencyCode={
                  selectors.metalRates.activeMetalRate?.currencyCode
                }
                updatedAt={selectors.metalRates.activeMetalRate?.effectiveFrom}
                usdAmdRate={usdAmdRate}
              />
            </div>
            <div className={styles.centerColumn}>
              <PricingBreakdown
                formData={formData}
                onPriceChange={(f, v) => setFormData((p) => ({ ...p, [f]: v }))}
                onSubmit={actions.handleSubmit}
                isLoading={uiState.isSubmitting}
                hasTriedSubmit={uiState.hasTriedSubmit}
              />
              <FinalOffer
                withRecalculate
                offerPrice={
                  initialOfferPrice ??
                  selectors.operator.intake?.offerPrice ??
                  0
                }
                currencyCode={selectors.operator.intake?.currencyCode}
                userData={userData}
                isRecalculationsLimitReached={
                  recalculationsAmount >= selectors.offerOptions.options.length
                }
                onReset={() =>
                  setUiState((prev) => ({
                    ...prev,
                    isRejectConfirmationOpen: true,
                  }))
                }
                setRecalculationsAmount={setRecalculationsAmount}
              />
            </div>
          </>
        ) : (
          <>
            <div className={styles.leftColumn}>
              <BuyIron
                cashRegisterId={userData?.cashRegisterId}
                onCalculateAttempt={() => setHasTriedCalculateIron(true)}
              />
            </div>
            <div className={styles.centerColumn}>
              <FinalOffer
                offerPrice={
                  selectors.ironCarShop.ironTotals?.totalAmountTotal ?? 0
                }
                currencyCode="AMD"
                userData={userData}
                isRecalculationsLimitReached={true}
                onReset={() =>
                  setUiState((prev) => ({
                    ...prev,
                    isRejectConfirmationOpen: true,
                  }))
                }
                onAccept={actions.handleBulkPurchase}
                isLoading={selectors.ironCarShop.isSubmitting}
              />
            </div>
          </>
        )}

        <div className={styles.rightColumn}>
          <CustomerDetails
            customerData={formData.customer}
            onCustomerChange={(customer) =>
              setFormData((prev) => ({ ...prev, customer }))
            }
            phoneError={
              (uiState.hasTriedSubmit || hasTriedCalculateIron) &&
              !formData.customer.phone
            }
            onSuccess={actions.handleResetForm}
            wide={isIron}
          />
        </div>
      </div>

      {!!selectors.cashRegisters.pendingDetails && (
        <TopUpConfirmationModal
          open={!!selectors.cashRegisters.pendingDetails}
          data={selectors.cashRegisters.pendingDetails}
          onConfirm={actions.handleConfirmTopUp}
          isLoading={selectors.cashRegisters.isPendingLoading}
        />
      )}

      {uiState.isRejectConfirmationOpen && (
        <ConfirmationModal
          open={uiState.isRejectConfirmationOpen}
          onOpenChange={(v) =>
            setUiState((p) => ({ ...p, isRejectConfirmationOpen: v }))
          }
          title={i18n.t("finalOffer.rejectButton")}
          description={i18n.t("common.areYouSure")}
          onConfirm={actions.handleConfirmReject}
          onCancel={() =>
            setUiState((p) => ({ ...p, isRejectConfirmationOpen: false }))
          }
        />
      )}

      {uiState.isCloseSessionModalOpen && (
        <ConfirmationModal
          open={uiState.isCloseSessionModalOpen}
          onOpenChange={(v) =>
            setUiState((p) => ({ ...p, isCloseSessionModalOpen: v }))
          }
          title={i18n.t("operatorPage.closeSession")}
          description={i18n.t("common.areYouSure")}
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
          title={i18n.t("header.logout")}
          description={i18n.t("common.areYouSure")}
          onConfirm={() => {
            dispatch(logout());
            navigate("/login");
          }}
          onCancel={() =>
            setUiState((p) => ({ ...p, isLogoutModalOpen: false }))
          }
        />
      )}

      {uiState.isTabConfirmModalOpen && (
        <ConfirmationModal
          open={uiState.isTabConfirmModalOpen}
          onOpenChange={(v) =>
            setUiState((p) => ({ ...p, isTabConfirmModalOpen: v }))
          }
          title={i18n.t("common.warning")}
          description={i18n.t("operatorPage.tabSwitchWarning")}
          onConfirm={() => {
            if (pendingTab) {
              actions.handleResetForm();
              setActiveTab(pendingTab);
            }
            setUiState((p) => ({ ...p, isTabConfirmModalOpen: false }));
            setPendingTab(null);
          }}
          onCancel={() => {
            setUiState((p) => ({ ...p, isTabConfirmModalOpen: false }));
            setPendingTab(null);
          }}
        />
      )}
    </div>
  );
};
