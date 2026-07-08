import { useEffect, useRef } from "react";

import { applyUserLanguagePreference } from "@/utils";

export const useDefaultLanguage = () => {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    const initialize = async () => {
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        isInitialized.current = true;
        return;
      }

      try {
        await applyUserLanguagePreference();
      } catch (error) {
        console.error("Language initialization failed:", error);
      } finally {
        isInitialized.current = true;
      }
    };

    initialize();
  }, []);
};
