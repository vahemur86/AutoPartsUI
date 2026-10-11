import { Header, BottomNav } from "@/components/common";
import { Outlet } from "react-router-dom";
import styles from "./Home.module.css";

export const Home = () => {
  return (
    <div className={styles.container}>
      <div className={styles.backgroundTexture} aria-hidden="true" />

      <div className={styles.overlay} aria-hidden="true" />

      {/* Content */}
      <div className={styles.content}>
        <Header />

        {/* Main Content - Routes will render here */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
    </div>
  );
};
