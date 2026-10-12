import { useTranslation } from "react-i18next";
import { Calculator, CalendarCheck2, Percent, UserCog, Wallet } from "lucide-react";
import { Tab } from "@/ui-kit";
import styles from "./EmployeeManagementNavigation.module.css";

export type EmployeeManagementTab = "employees" | "percentages" | "deposits" | "attendance" | "payroll";

interface EmployeeManagementNavigationProps {
  activeTab: EmployeeManagementTab;
  onChange: (tab: EmployeeManagementTab) => void;
  className?: string;
}

export const EmployeeManagementNavigation = ({
  activeTab,
  onChange,
  className = "",
}: EmployeeManagementNavigationProps) => {
  const { t } = useTranslation();

  return (
    <nav className={`${styles.navigation} ${className}`} aria-label={t("serviceTemplates.employeeManagement.navigationLabel")}>
      <div role="tablist">
        <Tab
          variant="underline"
          active={activeTab === "employees"}
          text={t("serviceTemplates.employeeManagement.tabs.employees")}
          icon={<UserCog size={14} />}
          onClick={() => onChange("employees")}
        />
        <Tab
          variant="underline"
          active={activeTab === "percentages"}
          text={t("serviceTemplates.employeeManagement.tabs.percentages")}
          icon={<Percent size={14} />}
          onClick={() => onChange("percentages")}
        />
        <Tab
          variant="underline"
          active={activeTab === "deposits"}
          text={t("serviceTemplates.employeeManagement.tabs.deposits")}
          icon={<Wallet size={14} />}
          onClick={() => onChange("deposits")}
        />
        <Tab
          variant="underline"
          active={activeTab === "attendance"}
          text={t("serviceTemplates.employeeManagement.tabs.attendance")}
          icon={<CalendarCheck2 size={14} />}
          onClick={() => onChange("attendance")}
        />
        <Tab
          variant="underline"
          active={activeTab === "payroll"}
          text={t("serviceTemplates.employeeManagement.tabs.payroll")}
          icon={<Calculator size={14} />}
          onClick={() => onChange("payroll")}
        />
      </div>
    </nav>
  );
};