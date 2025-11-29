import SectionHeader from "@/components/common/SectionHeader";
import styles from "./Warehouses.module.css";
import productIcon from "@/assets/icons/Vector (3).svg";

export const Warehouses = () => {
  return (
    <>
      <SectionHeader
        title="Products"
        icon={<img src={productIcon} alt="Products icon" />}
      />

      <div className={styles.warehousesPage}>
        <h1>Warehouses</h1>
        {/* Warehouses page content and child components will go here */}
      </div>
    </>
  );
};
