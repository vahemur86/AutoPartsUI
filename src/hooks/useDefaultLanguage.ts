import { useEffect, useRef } from "react";

import i18n from "@/i18n/config";
import { useAppSelector } from "@/store/hooks";
import { applyUserLanguagePreference } from "@/utils";

export const useDefaultLanguage = () => {
  const isInitialized = useRef(false);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (isInitialized.current) return;

    const initialize = async () => {
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        isInitialized.current = true;
        return;
      }

      try {
        if (user?.role.toLowerCase() === "agent") {
          const savedLanguage = localStorage.getItem("i18nextLng") || i18n.resolvedLanguage || i18n.language;
          if (i18n.hasResourceBundle(savedLanguage, "translation")) {
            await i18n.changeLanguage(savedLanguage);
          }
          return;
        }
        await applyUserLanguagePreference();
      } catch (error) {
        console.error("Language initialization failed:", error);
      } finally {
        isInitialized.current = true;
      }
    };

    initialize();
  }, [user]);
};
