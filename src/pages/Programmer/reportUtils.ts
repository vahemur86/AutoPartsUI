import type { ProgrammerReportResponse } from "@/types/settings";

export const normalizeProgrammerReport = (
  data: Partial<ProgrammerReportResponse> | null | undefined,
): ProgrammerReportResponse => ({
  programmerUserId: data?.programmerUserId ?? null,
  employeeId: Number(data?.employeeId ?? 0),
  from: data?.from ?? null,
  to: data?.to ?? null,
  totalServicesPerformed: Number(data?.totalServicesPerformed ?? 0),
  totalProgrammerCost: Number(data?.totalProgrammerCost ?? 0),
  totalPaidToProgrammer: Number(data?.totalPaidToProgrammer ?? 0),
  remainingToPay: Number(data?.remainingToPay ?? 0),
  byService: Array.isArray(data?.byService)
    ? data.byService.map((item) => ({
        serviceEstimateId: Number(item?.serviceEstimateId ?? 0),
        serviceId: Number(item?.serviceId ?? 0),
        serviceName: item?.serviceName ?? "-",
        timesPerformed: Number(item?.timesPerformed ?? 0),
        totalProgrammerCost: Number(item?.totalProgrammerCost ?? 0),
      }))
    : [],
});
