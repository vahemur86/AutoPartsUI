import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { IronPurchase } from "@/types/adminProducts";

// styles
import styles from "./IronProductsReport.module.css";

const columnHelper = createColumnHelper<IronPurchase>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getIronPurchaseColumns = (): ColumnDef<IronPurchase, any>[] => [
  columnHelper.accessor("productId", {
    header: "ID",
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("name", {
    header: i18next.t("products.form.productKey"),
    cell: (info) => info.getValue() || i18next.t("common.noData"),
  }),
  columnHelper.accessor("weight", {
    header: i18next.t("operatorPage.weightKg"),
    cell: (info) => `${info.getValue().toLocaleString()} kg`,
  }),
  columnHelper.accessor("unitPricePerKg", {
    header: i18next.t("warehouses.addProduct.columns.salePrice"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.accessor("totalAmount", {
    header: i18next.t("catalystBuckets.totalPrice"),
    cell: (info) => (
      <span className={styles.totalPriceCell}>
        {info.getValue().toLocaleString()} AMD
      </span>
    ),
  }),
  columnHelper.accessor("purchasedAt", {
    header: i18next.t("common.createdAt"),
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
];
