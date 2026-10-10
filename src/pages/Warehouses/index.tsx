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
  Receipt,
} from "lucide-react";

import { ReportsWorkspace, type ReportNavSection } from "@/pages/Reports/ReportsWorkspace";

export const Warehouses = () => {
  const { t } = useTranslation();

  const navigationSections: ReportNavSection[] = [
    {
      key: "powderLots",
      title: t("warehouses.navigationGroups.powderLots"),
      items: [
        {
          path: "/total-batches",
          label: t("warehouses.navigation.totalBatches"),
          icon: Boxes,
        },
        {
          path: "/batches-to-sale",
          label: t("warehouses.navigation.batchesToSale"),
          icon: Tag,
        },
        {
          path: "/sold-batches",
          label: t("warehouses.navigation.soldBatches"),
          icon: ClipboardCheck,
        },
        {
          path: "/adjusted-sales",
          label: t("warehouses.navigation.adjustedSales"),
          icon: Receipt,
        },
      ],
    },
    {
      key: "productsAndStock",
      title: t("warehouses.navigationGroups.productsAndStock"),
      items: [
        {
          path: "/add-product",
          label: t("warehouses.navigation.addProduct"),
          icon: Package,
        },
        {
          path: "/products",
          label: t("warehouses.navigation.products"),
          icon: Box,
        },
        {
          path: "/transfer-to-shop",
          label: t("warehouses.navigation.transferToShop"),
          icon: Store,
        },
      ],
    },
    {
      key: "financial",
      title: t("warehouses.navigationGroups.financial"),
      items: [
        {
          path: "/profit",
          label: t("warehouses.navigation.profit"),
          icon: Coins,
        },
      ],
    },
  ];

  return (
    <ReportsWorkspace
      sections={navigationSections}
      basePath="/warehouses"
      title={t("header.warehouses")}
      eyebrow={t("header.locations")}
      icon={Warehouse}
    />
  );
};
