// components
import { SectionHeader } from "@/components/common";
import { ShopProducts } from "@/components/shops/ShopProducts";
import { useTranslation } from "react-i18next";
import { Store } from "lucide-react";
// styles
import styles from "./Shops.module.css";

export const Shops = () => {
  const { t } = useTranslation();

  return (
    <>
      <SectionHeader title={t("header.shop")} icon={<Store />} />
      <div className={styles.shopsPage}>
        <ShopProducts />
      </div>
    </>
  );
};
