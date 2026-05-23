import { useTranslation } from "react-i18next";

import { Tasks } from "@/components/settings/VehicleManagement/task/Task";

export const ServiceTasks = () => {
  const { t } = useTranslation();

  return (
    <section>
      <h1>{t("settings.navigation.serviceTasks")}</h1>
      <Tasks />
    </section>
  );
};
