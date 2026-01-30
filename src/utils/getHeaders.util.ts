export const getHeaders = (cashRegisterId?: number) => ({
  ...(cashRegisterId && {
    "X-CashRegister-Id": cashRegisterId,
  }),
});
