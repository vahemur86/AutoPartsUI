import { useEffect, useRef } from "react";
import i18n from "i18next";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLanguages } from "@/store/slices/languagesSlice";

// utils
import { mapApiCodeToI18nCode } from "@/utils/languageMapping";

// types
import type { Language } from "@/types/settings";

export const useDefaultLanguage = () => {
  const dispatch = useAppDispatch();
  const { languages } = useAppSelector((state) => state.languages);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    const initialize = async () => {
      const accessToken = localStorage.getItem("access_token");
      const savedLanguage = localStorage.getItem("i18nextLng");

      if (
        !accessToken ||
        (savedLanguage && i18n.hasResourceBundle(savedLanguage, "translation"))
      ) {
        isInitialized.current = true;
        return;
      }

      try {
        let availableLanguages = languages;
        if (availableLanguages.length === 0) {
          const result = await dispatch(fetchLanguages()).unwrap();
          availableLanguages = result;
        }

        const defaultLang = availableLanguages.find(
          (lang: Language) => lang.isDefault,
        );

        if (defaultLang) {
          const i18nCode = mapApiCodeToI18nCode(defaultLang.code);

          if (i18n.hasResourceBundle(i18nCode, "translation")) {
            await i18n.changeLanguage(i18nCode);
            localStorage.setItem("i18nextLng", i18nCode);
          }
        }
      } catch (error) {
        console.error("Language initialization failed:", error);
      } finally {
        isInitialized.current = true;
      }
    };

    initialize();
  }, [dispatch, languages]);
};
