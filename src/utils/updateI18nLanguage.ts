import i18n from "@/i18n/config";
import { mapApiCodeToI18nCode } from "./languageMapping";

// Helper function to update i18n language when default language changes
export const updateI18nLanguage = (languageCode: string) => {
  const i18nCode = mapApiCodeToI18nCode(languageCode);
  if (i18n.hasResourceBundle(i18nCode, "translation")) {
    i18n.changeLanguage(i18nCode);
    localStorage.setItem("i18nextLng", i18nCode);
  } else {
    console.warn(
      `Translation resource not found for language code: ${i18nCode}`
    );
  }
};
