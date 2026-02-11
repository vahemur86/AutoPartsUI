import { useTranslation } from "react-i18next";

import {
  Boxes,
  Tag,
  ClipboardCheck,
  Warehouse,
  Coins,
  Package,
  Box,
  Store,
} from "lucide-react";

// components
import { ModuleLayout, type NavItem } from "@/components/common";

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
    {
      path: "/profit",
      label: t("warehouses.navigation.profit"),
      icon: Coins,
      showCheckmark: true,
    },
    {
      path: "/add-product",
      label: t("warehouses.navigation.addProduct"),
      icon: Package,
      showCheckmark: true,
    },
    {
      path: "/products",
      label: t("warehouses.navigation.products"),
      icon: Box,
      showCheckmark: true,
    },
    {
      path: "/transfer-to-shop",
      label: t("warehouses.navigation.transferToShop"),
      icon: Store,
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
