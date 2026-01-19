import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Tab, TabGroup } from "@/ui-kit";

// components
import { Tasks } from "./task/Task";
import { Vehicles } from "./vehicle/Vehicles";

// styles
import styles from "./VehicleManagement.module.css";

type VehicleManagementTab = "tasks" | "vehicles";

export const VehicleManagement = () => {
  const { t } = useTranslation();
  const [activeTabId, setActiveTabId] = useState<VehicleManagementTab>("tasks");

  const tabs = useMemo(
    () =>
      [
        { id: "tasks", label: t("vehicles.tabs.tasks") },
        { id: "vehicles", label: t("vehicles.tabs.vehicles") },
      ] as const,
    [t],
  );

  return (
    <section className={styles.vehicleManagementWrapper}>
      <div className={styles.vehicleManagement}>
        <nav
          className={styles.tabsContainer}
          aria-label={t("vehicles.ariaLabels.vehicleManagementSections")}
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

        {activeTabId === "tasks" && (
          <div role="tabpanel" aria-label={t("vehicles.tabs.tasks")}>
            <Tasks />
          </div>
        )}

        {activeTabId === "vehicles" && (
          <div role="tabpanel" aria-label={t("vehicles.tabs.vehicles")}>
            <Vehicles />
          </div>
        )}
      </div>
    </section>
  );
};
