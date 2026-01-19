/**
 * Maps API language codes to i18n language codes
 * The API may use different codes than i18n (e.g., "arm" vs "am")
 */
const LANGUAGE_CODE_MAP: Record<string, string> = {
  en: "en",
  ru: "ru",
  arm: "am", // API uses "arm", i18n uses "am"
  am: "am",
  fr: "fr",
};

/**
 * Converts an API language code to an i18n language code
 * @param apiCode - The language code from the API
 * @returns The corresponding i18n language code, or the original code if no mapping exists
 */
export const mapApiCodeToI18nCode = (apiCode: string): string => {
  const normalizedCode = apiCode.toLowerCase();
  return LANGUAGE_CODE_MAP[normalizedCode] || normalizedCode;
};

