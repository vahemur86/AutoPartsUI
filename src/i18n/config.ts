import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enTranslation from "@/locales/en/translation.json";
import ruTranslation from "@/locales/ru/translation.json";
import amTranslation from "@/locales/am/translation.json";
// import frTranslation from "@/locales/fr/translation.json";

// Translation resources
const resources = {
  en: {
    translation: enTranslation,
  },
  ru: {
    translation: ruTranslation,
  },
  am: {
    translation: amTranslation,
  },
  //   fr: {
  //     translation: frTranslation,
  //   },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en", // Default language
    debug: false,

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
