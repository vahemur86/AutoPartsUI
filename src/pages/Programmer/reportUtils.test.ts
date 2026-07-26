import { describe, expect, it } from "vitest";

import { normalizeProgrammerReport } from "./reportUtils";

describe("normalizeProgrammerReport", () => {
  it("maps the API payload into the UI-friendly report shape", () => {
    const report = normalizeProgrammerReport({
      programmerUserId: null,
      employeeId: 13,
      from: null,
      to: null,
      totalServicesPerformed: 3,
      totalProgrammerCost: 450000,
      totalPaidToProgrammer: 0,
      remainingToPay: 450000,
      byService: [
        {
          serviceEstimateId: 0,
          serviceId: 5,
          serviceName: "sport",
          timesPerformed: 3,
          totalProgrammerCost: 450000,
        },
      ],
    });

    expect(report.totalServicesPerformed).toBe(3);
    expect(report.totalProgrammerCost).toBe(450000);
    expect(report.remainingToPay).toBe(450000);
    expect(report.byService[0]).toEqual({
      serviceEstimateId: 0,
      serviceId: 5,
      serviceName: "sport",
      timesPerformed: 3,
      totalProgrammerCost: 450000,
    });
  });
});
