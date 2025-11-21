import { Header, BottomNav } from "@/components/common";
import { Outlet } from "react-router-dom";
import styles from "./Home.module.css";

// Import images
import bgImage from "@/assets/images/7190e5004198aeed8f646c2247def0d4ec9cbf6b.jpg";

export const Home = () => {
  return (
    <div className={styles.container}>
      {/* Background Image */}
      <div
        className={styles.backgroundImage}
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      />

      {/* Dark overlay */}
      <div className={styles.overlay} />

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
