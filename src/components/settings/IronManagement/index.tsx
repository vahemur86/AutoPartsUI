import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Tab, TabGroup } from "@/ui-kit";

// components
import { IronTypesAndPrices } from "./IronTypesAndPrices";

// styles
import styles from "./IronManagement.module.css";

type IronManagementTab = "iron-types-and-prices";

export const IronManagement = () => {
  const { t } = useTranslation();
  const [activeTabId] = useState<IronManagementTab>("iron-types-and-prices");

  const tabs = useMemo(
    () =>
      [
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
                onClick={() => undefined}
              />
            ))}
          </TabGroup>
        </nav>

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

