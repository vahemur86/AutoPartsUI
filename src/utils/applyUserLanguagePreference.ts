import i18n from "i18next";

// services
import { getUserLanguagePreference } from "@/services/userLanguage";

// utils
import { mapApiCodeToI18nCode } from "./languageMapping";

export const applyUserLanguagePreference = async () => {

  const preference = await getUserLanguagePreference();

  if (!preference.isPersonal || !preference.language) {
    return null;
  }

  const i18nCode = mapApiCodeToI18nCode(preference.language);

  if (i18n.hasResourceBundle(i18nCode, "translation")) {
    await i18n.changeLanguage(i18nCode);
    localStorage.setItem("i18nextLng", i18nCode);
    return i18nCode;
  }

  return null;
};
