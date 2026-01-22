import { useEffect, useRef } from "react";
import i18n from "i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLanguages } from "@/store/slices/languagesSlice";
import { mapApiCodeToI18nCode } from "@/utils/languageMapping";
import type { Language } from "@/types/settings";

/**
 * Hook to initialize the app language based on the default language from the API
 * This runs once on app load, but only if the user is authenticated
 */
export const useDefaultLanguage = () => {
  const dispatch = useAppDispatch();
  const { languages } = useAppSelector((state) => state.languages);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only run once
    if (hasInitialized.current) return;

    const initializeLanguage = async () => {
      try {
        // Check if user is authenticated (has access token)
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          // Not authenticated yet, skip initialization
          // Will be handled when user logs in
          hasInitialized.current = true;
          return;
        }

        const savedLanguage = localStorage.getItem("i18nextLng");
        if (
          savedLanguage &&
          i18n.hasResourceBundle(savedLanguage, "translation")
        ) {
          // User has a saved preference, use it
          hasInitialized.current = true;
          return;
        }

        // Fetch languages from Redux store and find the default one
        let languagesToUse = languages;
        if (languagesToUse.length === 0) {
          const result = await dispatch(fetchLanguages());
          if (fetchLanguages.fulfilled.match(result)) {
            languagesToUse = result.payload;
          } else {
            hasInitialized.current = true;
            return;
          }
        }

        const defaultLanguage = languagesToUse.find(
          (lang: Language) => lang.isDefault,
        );

        if (defaultLanguage) {
          const i18nCode = mapApiCodeToI18nCode(defaultLanguage.code);
          if (i18n.hasResourceBundle(i18nCode, "translation")) {
            i18n.changeLanguage(i18nCode);
            localStorage.setItem("i18nextLng", i18nCode);
          }
        }
      } catch (error) {
        console.error("Failed to initialize default language:", error);
      } finally {
        hasInitialized.current = true;
      }
    };

    initializeLanguage();
  }, [dispatch, languages]);
};
