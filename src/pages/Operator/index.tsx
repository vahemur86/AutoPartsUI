import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
  CalculateMode,
} from "./components";

// stores
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

// hooks
import { useOperator, type TabType } from "./hooks";

// styles
import styles from "./OperatorPage.module.css";

type MainTabType = "buy" | "calculate";

export const OperatorPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [searchParams, setSearchParams] = useSearchParams();

  const mainTab = (searchParams.get("view") as MainTabType) || "buy";

  const setMainTab = (tab: MainTabType) => {
    setSearchParams({ view: tab });
  };

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
    currentLanguageCode,
    usdAmdRate,
    isNonStandardCustomer,
    isFormDirty,
    selectors,
    actions,
  } = useOperator();

  const isIron = activeTab === "iron";

  const handleTabClick = (targetTab: TabType) => {
    if (activeTab === targetTab) return;

    if (isFormDirty) {
      setPendingTab(targetTab);
      setUiState((prev) => ({ ...prev, isTabConfirmModalOpen: true }));
    } else {
      setActiveTab(targetTab);
    }
  };

  const displayBalance = useMemo(() => {
    if (selectors.cashRegisters.isBalanceLoading)
      return t("cashRegisters.fetchingBalance");
    if (!uiState.showCashAmount) return "••••••••";

    return Number(
      selectors.cashRegisters.activeBalance?.balance || 0,
    ).toLocaleString();
  }, [
    selectors.cashRegisters.isBalanceLoading,
    selectors.cashRegisters.activeBalance?.balance,
    uiState.showCashAmount,
    t,
  ]);

  const getMarketPrice = (name: string) => {
    return selectors.metalPrices.prices.find(
      (p) => p.metalName.toLowerCase() === name.toLowerCase(),
    )?.price;
  };

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
        selectedApiCode={currentLanguageCode}
        onLanguageChange={actions.handleLanguageChange}
        isLangLoading={selectors.languagesState.isLoading}
        displayBalance={displayBalance}
        userData={userData}
        showCashAmount={uiState.showCashAmount}
        onToggleVisibility={() =>
          setUiState((p) => ({ ...p, showCashAmount: !uiState.showCashAmount }))
        }
        hasError={!!selectors.cashRegisters.balanceError}
      />

      <div className={styles.tabWrapper}>
        <Tab
          variant="underline"
          active={mainTab === "buy"}
          text={t("operatorPage.tabs.buy")}
          onClick={() => setMainTab("buy")}
        />
        <Tab
          variant="underline"
          active={mainTab === "calculate"}
          text={t("operatorPage.tabs.calculate")}
          onClick={() => setMainTab("calculate")}
        />
      </div>

      {mainTab === "buy" ? (
        <div className={styles.buyLayoutWrapper}>
          <div className={styles.subTabWrapper}>
            <Tab
              variant="underline"
              active={activeTab === "catalyst"}
              text={t("operatorPage.tabs.catalyst")}
              onClick={() => handleTabClick("catalyst")}
            />
            <Tab
              variant="underline"
              active={activeTab === "iron"}
              text={t("operatorPage.tabs.iron")}
              onClick={() => handleTabClick("iron")}
            />
          </div>

          <div className={styles.contentArea}>
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
                        uiState.hasTriedSubmit &&
                        isNaN(Number(formData.powderWeight))
                      }
                    />
                    <LiveMarketPrices
                      ptPricePerGram={
                        isNonStandardCustomer
                          ? getMarketPrice("Platinum")
                          : selectors.metalRates.activeMetalRate?.ptPricePerGram
                      }
                      pdPricePerGram={
                        isNonStandardCustomer
                          ? getMarketPrice("Palladium")
                          : selectors.metalRates.activeMetalRate?.pdPricePerGram
                      }
                      rhPricePerGram={
                        isNonStandardCustomer
                          ? getMarketPrice("Rhodium")
                          : selectors.metalRates.activeMetalRate?.rhPricePerGram
                      }
                      currencyCode={
                        selectors.metalRates.activeMetalRate?.currencyCode
                      }
                      updatedAt={
                        selectors.metalRates.activeMetalRate?.effectiveFrom
                      }
                      usdAmdRate={usdAmdRate}
                      isMarketData={isNonStandardCustomer}
                    />
                  </div>
                  <div className={styles.centerColumn}>
                    <PricingBreakdown
                      formData={formData}
                      onPriceChange={(f, v) =>
                        setFormData((p) => ({ ...p, [f]: v }))
                      }
                      onSubmit={actions.handleSubmit}
                      isLoading={uiState.isSubmitting}
                      hasTriedSubmit={uiState.hasTriedSubmit}
                    />
                    <FinalOffer
                      withRecalculate={!isNonStandardCustomer}
                      offerPrice={
                        initialOfferPrice ??
                        selectors.operator.intake?.offerPrice ??
                        0
                      }
                      currencyCode={
                        selectors.operator.intake?.currencyCode || "USD"
                      }
                      userData={userData}
                      isRecalculationsLimitReached={
                        recalculationsAmount >=
                        selectors.offerOptions.options.length
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
                      withRecalculate={!isNonStandardCustomer}
                      offerPrice={
                        selectors.ironCarShop.recalculationResult
                          ?.totalAmount ??
                        selectors.ironCarShop.ironTotals?.totalAmountTotal ??
                        0
                      }
                      currencyCode="AMD"
                      userData={userData}
                      isRecalculationsLimitReached={
                        !!selectors.ironCarShop.recalculationResult?.isLastStep
                      }
                      onReset={() =>
                        setUiState((prev) => ({
                          ...prev,
                          isRejectConfirmationOpen: true,
                        }))
                      }
                      onAccept={actions.handleBulkPurchase}
                      onRecalculate={actions.handleIronRecalculate}
                      isLoading={selectors.ironCarShop.isLoading}
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
                  onSuccess={() => {
                    actions.handleResetForm();
                    setHasTriedCalculateIron(false);
                  }}
                  wide={true}
                  activeTab={activeTab}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.contentArea}>
          <CalculateMode cashRegisterId={userData?.cashRegisterId} />
        </div>
      )}

      {/* --- Modals --- */}
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
          title={t("finalOffer.rejectButton")}
          description={t("common.areYouSure")}
          onConfirm={() => {
            actions.handleConfirmReject();
            actions.handleResetForm();
            setHasTriedCalculateIron(false);
          }}
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

      {uiState.isTabConfirmModalOpen && (
        <ConfirmationModal
          open={uiState.isTabConfirmModalOpen}
          onOpenChange={(v) =>
            setUiState((p) => ({ ...p, isTabConfirmModalOpen: v }))
          }
          title={t("common.warning")}
          description={t("operatorPage.tabSwitchWarning")}
          onConfirm={() => {
            if (pendingTab) {
              actions.handleResetForm();
              setHasTriedCalculateIron(false);
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
