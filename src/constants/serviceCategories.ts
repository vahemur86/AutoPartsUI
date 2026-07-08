export const PROGRAMMING_SERVICE_CATEGORY_CODE = "PROGRAMMING";

export const isProgrammingServiceCategory = (code?: string) =>
  String(code ?? "").trim().toLowerCase() ===
  PROGRAMMING_SERVICE_CATEGORY_CODE.toLowerCase();
