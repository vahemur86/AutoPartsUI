import { useMemo, useState } from "react";

// ui-kit
import { Tab, TabGroup } from "@/ui-kit";

// components
import { Tasks } from "./task/Task";
import { Vehicles } from "./vehicle/Vehicles";

// styles
import styles from "./VehicleManagement.module.css";

type VehicleManagementTab = "tasks" | "vehicles";

export const VehicleManagement = () => {
  const [activeTabId, setActiveTabId] = useState<VehicleManagementTab>("tasks");

  const tabs = useMemo(
    () =>
      [
        { id: "tasks", label: "Tasks" },
        { id: "vehicles", label: "Vehicles" },
      ] as const,
    [],
  );

  return (
    <section className={styles.vehicleManagementWrapper}>
      <div className={styles.vehicleManagement}>
        <nav
          className={styles.tabsContainer}
          aria-label="Vehicle management sections"
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
          <div role="tabpanel" aria-label="Tasks">
            <Tasks />
          </div>
        )}

        {activeTabId === "vehicles" && (
          <div role="tabpanel" aria-label="Vehicles">
            <Vehicles />
          </div>
        )}
      </div>
    </section>
  );
};
