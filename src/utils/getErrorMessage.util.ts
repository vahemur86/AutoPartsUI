export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as unknown as Error).message);
  }
  return fallback;
};
