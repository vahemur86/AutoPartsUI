/**
 * Gets the cash register ID from localStorage user_data
 * @param defaultValue - The default value to return if cashRegisterId is not found (default: 1)
 * @returns The cash register ID as a number, or the default value if not found
 */
export const getCashRegisterId = (defaultValue: number = 1): number => {
  try {
    const rawData = localStorage.getItem("user_data");
    if (!rawData) {
      return defaultValue;
    }

    const userData = JSON.parse(rawData);
    return userData.cashRegisterId
      ? Number(userData.cashRegisterId)
      : defaultValue;
  } catch {
    return defaultValue;
  }
};
