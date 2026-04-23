export const getHeaders = (cashRegisterId?: number, pageKey?: string) => {
  return {
    ...(cashRegisterId && { "X-CashRegister-Id": cashRegisterId }),
    ...(pageKey && { "X-Page-Key": pageKey }),
  };
};
