import type { CallAcceptedResponse } from "@/types/calling";

export const isValidCallAcceptance = (
  response: CallAcceptedResponse,
  callId: string,
  userId: number | null,
  httpStatus: number,
) =>
  httpStatus >= 200
  && httpStatus < 300
  && response.callId === callId
  && response.status === "Accepted"
  && Number.isInteger(response.assignedCashierId)
  && response.assignedCashierId > 0
  && userId !== null
  && response.assignedCashierId === userId;
