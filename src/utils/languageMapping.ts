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
 * Reverse map: i18n language codes to API language codes
 */
const I18N_TO_API_MAP: Record<string, string> = {
  en: "en",
  ru: "ru",
  am: "hy", // i18n uses "am", API uses "hy" for Armenian
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

/**
 * Converts an i18n language code to an API language code
 * @param i18nCode - The language code from i18n
 * @returns The corresponding API language code, or the original code if no mapping exists
 */
export const mapI18nCodeToApiCode = (i18nCode: string): string => {
  const normalizedCode = i18nCode.toLowerCase();
  return I18N_TO_API_MAP[normalizedCode] || normalizedCode;
};
