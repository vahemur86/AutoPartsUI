import i18n from "i18next";

// services
import { getUserLanguagePreference } from "@/services/userLanguage";

// utils
import { mapApiCodeToI18nCode } from "./languageMapping";

const resolveSupportedLanguage = (candidate: string | null | undefined): string => {
  const normalized = candidate?.trim();

  if (!normalized) {
    return "en";
  }

  const mapped = mapApiCodeToI18nCode(normalized);

  if (mapped === "ru" || mapped === "am" || mapped === "en") {
    return mapped;
  }

  if (normalized.toLowerCase().startsWith("ru")) return "ru";
  if (normalized.toLowerCase().startsWith("hy") || normalized.toLowerCase().startsWith("am")) return "am";

  return "en";
};

export const applyUserLanguagePreference = async () => {
  try {
    const preference = await getUserLanguagePreference();
    const preferredLanguage = preference.isPersonal && preference.language
      ? preference.language
      : navigator.language || localStorage.getItem("i18nextLng") || "en";

    const i18nCode = resolveSupportedLanguage(preferredLanguage);

    if (i18n.hasResourceBundle(i18nCode, "translation")) {
      await i18n.changeLanguage(i18nCode);
      localStorage.setItem("i18nextLng", i18nCode);
      return i18nCode;
    }
  } catch (error) {
    console.error("Language initialization failed:", error);
  }

  const fallbackCode = resolveSupportedLanguage(
    navigator.language || localStorage.getItem("i18nextLng") || "en",
  );

  if (i18n.hasResourceBundle(fallbackCode, "translation")) {
    await i18n.changeLanguage(fallbackCode);
    localStorage.setItem("i18nextLng", fallbackCode);
    return fallbackCode;
  }

  return null;
};
