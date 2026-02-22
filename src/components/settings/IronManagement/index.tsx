import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Tab, TabGroup } from "@/ui-kit";

// components
import { CarModels } from "./CarModels";
import { IronTypesAndPrices } from "./IronTypesAndPrices";

// styles
import styles from "./IronManagement.module.css";

type IronManagementTab = "car-models" | "iron-types-and-prices";

export const IronManagement = () => {
  const { t } = useTranslation();
  const [activeTabId, setActiveTabId] =
    useState<IronManagementTab>("car-models");

  const tabs = useMemo(
    () =>
      [
        { id: "car-models", label: t("ironManagement.tabs.carModels") },
        {
          id: "iron-types-and-prices",
          label: t("ironManagement.tabs.ironTypesAndPrices"),
        },
      ] as const,
    [t],
  );

  return (
    <section className={styles.ironManagementWrapper}>
      <div className={styles.ironManagement}>
        <nav
          className={styles.tabsContainer}
          aria-label={t("ironManagement.ariaLabels.ironManagementSections")}
        >
          <TabGroup variant="segmented">
            {tabs.map(({ id, label }) => (
              <Tab
                key={id}
                variant="segmented"
                active={activeTabId === id}
                text={label}
                onClick={() => setActiveTabId(id)}
              />
            ))}
          </TabGroup>
        </nav>

        {activeTabId === "car-models" && (
          <div role="tabpanel" aria-label={t("ironManagement.tabs.carModels")}>
            <CarModels />
          </div>
        )}

        {activeTabId === "iron-types-and-prices" && (
          <div
            role="tabpanel"
            aria-label={t("ironManagement.tabs.ironTypesAndPrices")}
          >
            <IronTypesAndPrices />
          </div>
        )}
      </div>
    </section>
  );
};

