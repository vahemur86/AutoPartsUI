export const getHeaders = (cashRegisterId?: number, pageKey?: string) => {
  const normalizedCashRegisterId = Number(cashRegisterId);
  const hasValidCashRegisterId =
    Number.isFinite(normalizedCashRegisterId) && normalizedCashRegisterId > 0;

  return {
    ...(hasValidCashRegisterId && {
      "X-CashRegister-Id": String(normalizedCashRegisterId),
    }),
    ...(pageKey && { "X-Page-Key": pageKey }),
  };
};
