import { useTranslation } from "react-i18next";

import { Boxes, Tag, ClipboardCheck, Warehouse } from "lucide-react";

// components
import { ModuleLayout, type NavItem } from "@/components/common/ModuleLayout";

export const Warehouses = () => {
  const { t } = useTranslation();

  const navigationItems: NavItem[] = [
    {
      path: "/total-batches",
      label: t("warehouses.navigation.totalBatches"),
      icon: Boxes,
      showCheckmark: true,
    },
    {
      path: "/batches-to-sale",
      label: t("warehouses.navigation.batchesToSale"),
      icon: Tag,
      showCheckmark: true,
    },
    {
      path: "/sold-batches",
      label: t("warehouses.navigation.soldBatches"),
      icon: ClipboardCheck,
      showCheckmark: true,
    },
  ];

  return (
    <ModuleLayout
      basePath="/warehouses"
      navigationItems={navigationItems}
      defaultTitle={t("header.warehouses")}
      defaultIcon={Warehouse}
    />
  );
};
