import { useEffect, useState } from "react";

// Hook to detect mobile with SSR safety
export const useIsMobile = () => {
  // Initialize with a check if we're in browser (for faster initial render)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      );
    }
    return false;
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        const width = window.innerWidth;
        const isMobileDevice =
          width < 768 ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          );
        setIsMobile(isMobileDevice);
      }
    };
    // Double-check on mount
    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, []);

  return { isMobile, mounted };
};
